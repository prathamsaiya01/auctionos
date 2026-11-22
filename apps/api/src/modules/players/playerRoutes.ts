import { Router } from 'express';
import { PlayerController } from './playerController';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/tournament/:tournamentId', authenticate, PlayerController.listByTournament);
router.post('/', authenticate, PlayerController.create);
router.get('/:id', authenticate, PlayerController.getById);
router.patch('/:id/verify', authenticate, PlayerController.verify);

export default router;
