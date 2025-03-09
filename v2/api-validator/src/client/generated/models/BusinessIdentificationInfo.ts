/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { PostalAddress } from './PostalAddress';
import type { RelationshipType } from './RelationshipType';

/**
 * Information related to the business entity acting as the beneficiary of  the transaction, including the business name, registration number, and  any relevant identifiers, as well as its relationship type and postal  address for communication.
 */
export type BusinessIdentificationInfo = {
    entityType?: BusinessIdentificationInfo.entityType;
    /**
     * A unique identifier assigned by an external system to track the  transaction or entity across different platforms.
     */
    externalReferenceId?: string;
    relationshipType?: RelationshipType;
    /**
     * The legal name of the business entity as registered with the relevant  authorities. This name is used in official documents and transactions.
     */
    businessName?: string;
    /**
     * A unique identifier assigned to the business entity by the relevant  regulatory authority, often used for tax and legal purposes.
     */
    registrationNumber?: string;
    postalAddress?: PostalAddress;
};

export namespace BusinessIdentificationInfo {

    export enum entityType {
        BUSINESS = 'Business',
    }


}

