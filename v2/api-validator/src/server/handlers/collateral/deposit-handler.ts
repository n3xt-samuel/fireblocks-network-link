import { FastifyRequest, FastifyReply } from 'fastify';
import * as ErrorFactory from '../../http-error-factory';
import { CollateralController } from '../../controllers/collateral/collateral-controller';
import {
  CollateralDepositTransactionRequest,
  CollateralDepositTransactionResponse,
  CollateralDepositTransactionsResponse,
} from '../../../client/generated';
import { ControllersContainer } from '../../controllers/controllers-container';
import { getPaginationResult } from '../../controllers/pagination-controller';
import {
  AccountIdPathParam,
  PaginationQuerystring,
  CollateralIdPathParam,
  CollateralTxIdPathParam,
} from '../request-types';

const controllers = new ControllersContainer(() => new CollateralController());

export async function registerCollateralDepositTransaction(
  request: FastifyRequest<
    AccountIdPathParam & CollateralIdPathParam & { Body: CollateralDepositTransactionRequest }
  >,
  reply: FastifyReply
): Promise<CollateralDepositTransactionResponse> {
  {
    const { collateralTxId, amount } = request.body;
    const { accountId } = request.params;

    const controller = controllers.getController(accountId);

    if (!controller) {
      return ErrorFactory.notFound(reply);
    }

    const newCollateralDepositTransaction = controller.registerCollateralDepositTransaction(
      amount,
      collateralTxId
    );
    return newCollateralDepositTransaction;
  }
}

export async function getCollateralDepositTransactions(
  request: FastifyRequest<PaginationQuerystring & AccountIdPathParam & CollateralIdPathParam>,
  reply: FastifyReply
): Promise<CollateralDepositTransactionsResponse> {
  const { limit, startingAfter, endingBefore } = request.query;
  const { accountId } = request.params;

  const controller = controllers.getController(accountId);

  if (!controller) {
    return ErrorFactory.notFound(reply);
  }

  const transactionList = controller.getCollateralDepositTransactions();

  return {
    transactions: getPaginationResult(limit, startingAfter, endingBefore, transactionList, 'id'),
  };
}

export async function getCollateralDepositTransactionDetails(
  request: FastifyRequest<
    PaginationQuerystring & AccountIdPathParam & CollateralIdPathParam & CollateralTxIdPathParam
  >,
  reply: FastifyReply
): Promise<CollateralDepositTransactionResponse> {
  const { accountId, collateralTxId } = request.params;

  const controller = controllers.getController(accountId);

  if (!controller) {
    return ErrorFactory.notFound(reply);
  }

  const transaction = controller.getCollateralDepositTransactionDetails(collateralTxId);

  return transaction;
}
