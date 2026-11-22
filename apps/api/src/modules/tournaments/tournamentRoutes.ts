import { Router } from 'express';
import { TournamentController } from './tournamentController';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/', authenticate, TournamentController.list);
router.post('/', authenticate, TournamentController.create);
router.get('/:id', authenticate, TournamentController.getById);

export default router;
