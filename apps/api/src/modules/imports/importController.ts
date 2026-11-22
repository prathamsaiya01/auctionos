import { Response, NextFunction } from 'express';
import { prisma } from '@auctionos/database';
import { AuthenticatedRequest } from '../../middleware/auth';
import { ExcelImportService, ColumnMapping } from './importService';
import ExcelJS from 'exceljs';
import { LotStatus } from '@auctionos/shared';

// Temporary in-memory cache for parsed upload jobs
const uploadJobs = new Map<string, {
  fileName: string;
  fileSize: number;
  headers: string[];
  suggestedMapping: ColumnMapping;
  rows: Record<string, any>[];
}>();

export class ImportController {
  static async upload(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ success: false, message: 'Please upload an Excel file (.xlsx)' });
        return;
      }

      const { headers, rows } = await ExcelImportService.parseBuffer(file.buffer);
      const suggestedMapping = ExcelImportService.detectColumnMapping(headers);

      const importJobId = `job_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      uploadJobs.set(importJobId, {
        fileName: file.originalname,
        fileSize: file.size,
        headers,
        suggestedMapping,
        rows
      });

      // Preview with suggested mapping
      const validatedRows = ExcelImportService.validateAndMapRows(rows.slice(0, 30), suggestedMapping);

      res.json({
        success: true,
        data: {
          importJobId,
          fileName: file.originalname,
          totalRows: rows.length,
          headers,
          suggestedMapping,
          previewRows: validatedRows
        }
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: `Failed to parse Excel file: ${err.message}` });
    }
  }

  static async validateMapping(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { importJobId, mapping } = req.body;
      const job = uploadJobs.get(importJobId);

      if (!job) {
        res.status(404).json({ success: false, message: 'Import job expired or not found. Please upload again.' });
        return;
      }

      const validated = ExcelImportService.validateAndMapRows(job.rows, mapping);
      const validCount = validated.filter((r) => r.isValid).length;
      const invalidCount = validated.length - validCount;

      res.json({
        success: true,
        data: {
          totalRows: job.rows.length,
          validCount,
          invalidCount,
          preview: validated.slice(0, 50)
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async confirmImport(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { importJobId, tournamentId, mapping, targetAuctionId } = req.body;
      const job = uploadJobs.get(importJobId);

      if (!job) {
        res.status(404).json({ success: false, message: 'Import session expired. Please upload file again.' });
        return;
      }

      const validated = ExcelImportService.validateAndMapRows(job.rows, mapping || job.suggestedMapping);
      const validRows = validated.filter((r) => r.isValid);

      if (validRows.length === 0) {
        res.status(400).json({ success: false, message: 'No valid player rows found to import.' });
        return;
      }

      // Check current lot count if targeting an auction
      let currentMaxLotSequence = 0;
      if (targetAuctionId) {
        const lastLot = await prisma.auctionLot.findFirst({
          where: { auctionId: targetAuctionId },
          orderBy: { sequenceOrder: 'desc' }
        });
        currentMaxLotSequence = lastLot?.sequenceOrder || 0;
      }

      let importedCount = 0;
      const createdPlayers = [];

      for (const row of validRows) {
        const p = row.mapped;

        const player = await prisma.player.create({
          data: {
            tournamentId,
            fullName: p.fullName,
            displayName: p.fullName.split(' ')[0],
            age: p.age || null,
            city: p.city || null,
            state: p.state || null,
            mobileNumber: p.mobileNumber || null,
            whatsappNumber: p.mobileNumber || null,
            email: p.email || null,
            role: p.role,
            battingStyle: p.battingStyle || null,
            bowlingStyle: p.bowlingStyle || null,
            playerCategory: p.playerCategory,
            basePrice: BigInt(p.basePrice),
            photoUrl: p.photoUrl || null,
            isVerified: true,
            stats: {
              create: {
                matches: p.matches || 0,
                runs: p.runs || 0,
                wickets: p.wickets || 0
              }
            },
            consents: {
              create: {
                consentWhatsapp: true,
                consentSMS: true,
                consentEmail: true
              }
            }
          }
        });

        // Optionally add directly to auction pool
        if (targetAuctionId) {
          currentMaxLotSequence++;
          await prisma.auctionLot.create({
            data: {
              auctionId: targetAuctionId,
              playerId: player.id,
              sequenceOrder: currentMaxLotSequence,
              basePrice: player.basePrice,
              currentBid: BigInt(0),
              status: LotStatus.QUEUED
            }
          });
        }

        createdPlayers.push(player);
        importedCount++;
      }

      // Record in ExcelImport log
      await prisma.excelImport.create({
        data: {
          tournamentId,
          fileName: job.fileName,
          fileSize: job.fileSize,
          totalRows: job.rows.length,
          validRows: validRows.length,
          invalidRows: job.rows.length - validRows.length,
          importedRows: importedCount,
          status: 'COMPLETED',
          columnMapping: mapping || job.suggestedMapping
        }
      });

      // Clear memory
      uploadJobs.delete(importJobId);

      res.status(201).json({
        success: true,
        message: `Successfully imported ${importedCount} players${targetAuctionId ? ' and added them directly to auction pool!' : '!'}`,
        data: {
          importedCount,
          totalRows: job.rows.length,
          invalidCount: job.rows.length - validRows.length
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async downloadTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const type = req.params.type || 'basic'; // basic, complete, auction
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Players');

      if (type === 'complete') {
        worksheet.columns = [
          { header: 'Full Name', key: 'fullName', width: 25 },
          { header: 'Mobile Number', key: 'mobile', width: 18 },
          { header: 'Email', key: 'email', width: 25 },
          { header: 'Age', key: 'age', width: 10 },
          { header: 'City', key: 'city', width: 15 },
          { header: 'State', key: 'state', width: 15 },
          { header: 'Playing Role', key: 'role', width: 18 },
          { header: 'Batting Style', key: 'batting', width: 18 },
          { header: 'Bowling Style', key: 'bowling', width: 22 },
          { header: 'Base Price', key: 'basePrice', width: 15 },
          { header: 'Category', key: 'category', width: 15 },
          { header: 'Matches', key: 'matches', width: 10 },
          { header: 'Runs', key: 'runs', width: 10 },
          { header: 'Wickets', key: 'wickets', width: 10 },
          { header: 'Photo URL', key: 'photoUrl', width: 35 }
        ];

        worksheet.addRow({
          fullName: 'Rohit Verma',
          mobile: '+919876543210',
          email: 'rohit@example.com',
          age: 26,
          city: 'Mumbai',
          state: 'Maharashtra',
          role: 'Batsman',
          batting: 'Right-hand',
          bowling: 'None',
          basePrice: 5000,
          category: 'Marquee',
          matches: 32,
          runs: 1140,
          wickets: 0,
          photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e'
        });
      } else {
        worksheet.columns = [
          { header: 'Player Name', key: 'fullName', width: 25 },
          { header: 'Mobile Number', key: 'mobile', width: 18 },
          { header: 'Email', key: 'email', width: 25 },
          { header: 'Age', key: 'age', width: 10 },
          { header: 'City', key: 'city', width: 15 },
          { header: 'Player Role', key: 'role', width: 18 },
          { header: 'Base Price', key: 'basePrice', width: 15 },
          { header: 'Category', key: 'category', width: 15 }
        ];

        worksheet.addRow({
          fullName: 'Ajay Kumble',
          mobile: '+919876543211',
          email: 'ajay@example.com',
          age: 24,
          city: 'Bengaluru',
          role: 'Bowler',
          basePrice: 2000,
          category: 'Regular'
        });
      }

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=AuctionOS_Player_Template_${type}.xlsx`);

      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      next(err);
    }
  }
}
