import { Router } from 'express';
import { TeamController } from './teamController';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/tournament/:tournamentId', authenticate, TeamController.listByTournament);
router.post('/', authenticate, TeamController.create);
router.get('/:id', authenticate, TeamController.getById);
router.post('/:id/invite', authenticate, TeamController.inviteOwner);

export default router;
