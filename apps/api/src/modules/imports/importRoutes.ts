import { Router } from 'express';
import multer from 'multer';
import { ImportController } from './importController';
import { authenticate } from '../../middleware/auth';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const router = Router();

router.post('/upload', authenticate, upload.single('file'), ImportController.upload);
router.post('/validate-mapping', authenticate, ImportController.validateMapping);
router.post('/confirm', authenticate, ImportController.confirmImport);
router.get('/templates/:type', ImportController.downloadTemplate);

export default router;
