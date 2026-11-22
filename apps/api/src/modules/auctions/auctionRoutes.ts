import { Router } from 'express';
import { AuctionController } from './auctionController';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/:id/snapshot', authenticate, AuctionController.getSnapshot);
router.post('/', authenticate, AuctionController.create);
router.post('/:id/start', authenticate, AuctionController.start);
router.post('/:id/pause', authenticate, AuctionController.pause);
router.post('/:id/resume', authenticate, AuctionController.resume);
router.post('/:id/next-player', authenticate, AuctionController.nextPlayer);
router.post('/:id/bids', authenticate, AuctionController.placeBid);
router.post('/:id/sold', authenticate, AuctionController.markSold);
router.post('/:id/unsold', authenticate, AuctionController.markUnsold);
router.post('/:id/reverse-action', authenticate, AuctionController.reverseAction);

export default router;
