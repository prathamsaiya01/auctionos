import { Router } from 'express';
import { InvitationController } from './invitationController';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/:token', InvitationController.getByToken);
router.post('/:token/accept', authenticate, InvitationController.accept);

export default router;
