import { Router } from 'express';
import { NotificationController } from './notificationController';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/delivery-report', authenticate, NotificationController.getDeliveryReport);
router.post('/:id/retry', authenticate, NotificationController.retry);

export default router;
