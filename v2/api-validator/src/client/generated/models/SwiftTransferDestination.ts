/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { PositiveAmount } from './PositiveAmount';
import type { SwiftAddress } from './SwiftAddress';

export type SwiftTransferDestination = (SwiftAddress & {
    amount: PositiveAmount;
});

