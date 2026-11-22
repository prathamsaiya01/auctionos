import ExcelJS from 'exceljs';
import { CricketRole, BattingStyle, BowlingStyle } from '@auctionos/shared';

export interface ColumnMapping {
  fullName: string;
  mobileNumber?: string;
  email?: string;
  age?: string;
  city?: string;
  state?: string;
  role?: string;
  battingStyle?: string;
  bowlingStyle?: string;
  playerCategory?: string;
  basePrice?: string;
  photoUrl?: string;
  matches?: string;
  runs?: string;
  wickets?: string;
}

export interface ParsedRow {
  rowIndex: number;
  raw: Record<string, any>;
  mapped: {
    fullName: string;
    mobileNumber?: string;
    email?: string;
    age?: number;
    city?: string;
    state?: string;
    role: CricketRole;
    battingStyle?: BattingStyle;
    bowlingStyle?: BowlingStyle;
    playerCategory: string;
    basePrice: number;
    photoUrl?: string;
    matches?: number;
    runs?: number;
    wickets?: number;
  };
  isValid: boolean;
  errors: string[];
}

export class ExcelImportService {
  static detectColumnMapping(headers: string[]): ColumnMapping {
    const mapping: Partial<ColumnMapping> = {};

    headers.forEach((h) => {
      const clean = h.trim().toLowerCase();

      if (/^(player\s*name|full\s*name|name)$/i.test(clean)) mapping.fullName = h;
      else if (/^(mobile|phone|contact|whatsapp)$/i.test(clean)) mapping.mobileNumber = h;
      else if (/^(email|mail)$/i.test(clean)) mapping.email = h;
      else if (/^(age|player\s*age)$/i.test(clean)) mapping.age = h;
      else if (/^(city|location|town)$/i.test(clean)) mapping.city = h;
      else if (/^(state)$/i.test(clean)) mapping.state = h;
      else if (/^(role|playing\s*role|player\s*type|type)$/i.test(clean)) mapping.role = h;
      else if (/^(batting|batting\s*style)$/i.test(clean)) mapping.battingStyle = h;
      else if (/^(bowling|bowling\s*style)$/i.test(clean)) mapping.bowlingStyle = h;
      else if (/^(category|player\s*category|grade)$/i.test(clean)) mapping.playerCategory = h;
      else if (/^(base\s*price|base\s*amount|price|base)$/i.test(clean)) mapping.basePrice = h;
      else if (/^(photo|image|picture|photo\s*url|avatar)$/i.test(clean)) mapping.photoUrl = h;
      else if (/^(matches|m)$/i.test(clean)) mapping.matches = h;
      else if (/^(runs|r)$/i.test(clean)) mapping.runs = h;
      else if (/^(wickets|wkts|w)$/i.test(clean)) mapping.wickets = h;
    });

    return mapping as ColumnMapping;
  }

  static parseRole(val?: any): CricketRole {
    if (!val) return CricketRole.ALL_ROUNDER;
    const str = String(val).toUpperCase().trim();
    if (str.includes('BAT')) return CricketRole.BATSMAN;
    if (str.includes('BOWL')) return CricketRole.BOWLER;
    if (str.includes('KEEP') || str.includes('WK')) return CricketRole.WICKET_KEEPER;
    return CricketRole.ALL_ROUNDER;
  }

  static parseBattingStyle(val?: any): BattingStyle | undefined {
    if (!val) return BattingStyle.RIGHT_HAND;
    const str = String(val).toUpperCase().trim();
    if (str.includes('LEFT')) return BattingStyle.LEFT_HAND;
    return BattingStyle.RIGHT_HAND;
  }

  static parseBowlingStyle(val?: any): BowlingStyle | undefined {
    if (!val) return BowlingStyle.NONE;
    const str = String(val).toUpperCase().trim();
    if (str.includes('LEFT') && str.includes('FAST')) return BowlingStyle.LEFT_ARM_FAST;
    if (str.includes('LEFT') && str.includes('SPIN')) return BowlingStyle.LEFT_ARM_SPIN;
    if (str.includes('RIGHT') && str.includes('FAST')) return BowlingStyle.RIGHT_ARM_FAST;
    if (str.includes('RIGHT') && str.includes('SPIN')) return BowlingStyle.RIGHT_ARM_SPIN;
    if (str.includes('SPIN')) return BowlingStyle.RIGHT_ARM_SPIN;
    if (str.includes('FAST')) return BowlingStyle.RIGHT_ARM_FAST;
    return BowlingStyle.RIGHT_ARM_MEDIUM;
  }

  static async parseBuffer(buffer: any): Promise<{ headers: string[]; rows: Record<string, any>[] }> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('Workbook contains no worksheets.');
    }

    const headers: string[] = [];
    const rows: Record<string, any>[] = [];

    worksheet.eachRow((row, rowNumber) => {
      const values = Array.isArray(row.values) ? row.values.slice(1) : [];

      if (rowNumber === 1) {
        values.forEach((v) => headers.push(String(v || '').trim()));
      } else {
        const rowData: Record<string, any> = {};
        headers.forEach((header, idx) => {
          rowData[header] = values[idx] !== undefined ? values[idx] : null;
        });
        rows.push(rowData);
      }
    });

    return { headers, rows };
  }

  static validateAndMapRows(rows: Record<string, any>[], mapping: ColumnMapping): ParsedRow[] {
    return rows.map((raw, idx) => {
      const errors: string[] = [];

      const rawName = mapping.fullName ? raw[mapping.fullName] : null;
      const fullName = String(rawName || '').trim();

      if (!fullName) {
        errors.push('Player name is required.');
      }

      const rawPrice = mapping.basePrice ? raw[mapping.basePrice] : null;
      let basePrice = Number(rawPrice);
      if (isNaN(basePrice) || basePrice < 0) {
        basePrice = 1000; // default base price
      }

      const rawAge = mapping.age ? Number(raw[mapping.age]) : undefined;
      const age = !isNaN(rawAge!) && rawAge! > 0 ? rawAge : undefined;

      const role = ExcelImportService.parseRole(mapping.role ? raw[mapping.role] : null);
      const battingStyle = ExcelImportService.parseBattingStyle(mapping.battingStyle ? raw[mapping.battingStyle] : null);
      const bowlingStyle = ExcelImportService.parseBowlingStyle(mapping.bowlingStyle ? raw[mapping.bowlingStyle] : null);

      return {
        rowIndex: idx + 2, // Excel 1-based, header is 1
        raw,
        mapped: {
          fullName,
          mobileNumber: mapping.mobileNumber && raw[mapping.mobileNumber] ? String(raw[mapping.mobileNumber]).trim() : undefined,
          email: mapping.email && raw[mapping.email] ? String(raw[mapping.email]).trim() : undefined,
          age,
          city: mapping.city && raw[mapping.city] ? String(raw[mapping.city]).trim() : undefined,
          state: mapping.state && raw[mapping.state] ? String(raw[mapping.state]).trim() : undefined,
          role,
          battingStyle,
          bowlingStyle,
          playerCategory: mapping.playerCategory && raw[mapping.playerCategory] ? String(raw[mapping.playerCategory]).trim() : 'Regular',
          basePrice,
          photoUrl: mapping.photoUrl && raw[mapping.photoUrl] ? String(raw[mapping.photoUrl]).trim() : undefined,
          matches: mapping.matches && !isNaN(Number(raw[mapping.matches])) ? Number(raw[mapping.matches]) : 0,
          runs: mapping.runs && !isNaN(Number(raw[mapping.runs])) ? Number(raw[mapping.runs]) : 0,
          wickets: mapping.wickets && !isNaN(Number(raw[mapping.wickets])) ? Number(raw[mapping.wickets]) : 0
        },
        isValid: errors.length === 0,
        errors
      };
    });
  }
}
