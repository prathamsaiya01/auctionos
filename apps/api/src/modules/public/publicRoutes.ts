import { Router } from 'express';
import { PublicController } from './publicController';

const router = Router();

router.get('/auctions/:id/snapshot', PublicController.getAuctionSnapshot);
router.get('/tournaments/:tournamentId/teams', PublicController.getTournamentTeams);

export default router;
