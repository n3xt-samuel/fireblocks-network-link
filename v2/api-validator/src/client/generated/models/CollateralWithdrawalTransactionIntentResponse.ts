/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { ApprovalRequest } from './ApprovalRequest';
import type { CollateralTransactionIntentStatus } from './CollateralTransactionIntentStatus';

export type CollateralWithdrawalTransactionIntentResponse = {
    /**
     * A unique identifier of the transaction to track. This field will contain information to help the provider poll the status of the transaction from Fireblocks.
     *
     */
    id: string;
    approvalRequest: ApprovalRequest;
    status: CollateralTransactionIntentStatus;
    rejectionReason?: string;
};

