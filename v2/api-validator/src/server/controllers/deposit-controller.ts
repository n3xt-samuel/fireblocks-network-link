import RandExp from 'randexp';
import { randomUUID } from 'crypto';
import { XComError } from '../../error';
import { AssetsController, UnknownAdditionalAssetError } from './assets-controller';
import {
  Deposit,
  DepositAddress,
  DepositAddressCreationRequest,
  DepositAddressStatus,
  DepositCapability,
  DepositDestination,
  IbanCapability,
  PublicBlockchainCapability,
  SwiftCapability,
} from '../../client/generated';
import { Repository } from './repository';
import { fakeSchemaObject } from '../../schemas';
import { JSONSchemaFaker } from 'json-schema-faker';

export class DepositAddressNotFoundError extends XComError {
  constructor() {
    super('Deposit address not found');
  }
}

export class DepositNotFoundError extends XComError {
  constructor() {
    super('Deposit not found');
  }
}

export class DepositAddressDisabledError extends XComError {
  constructor(id: string) {
    super('Deposit address is disabled', { id });
  }
}

const DEFAULT_CAPABILITIES_COUNT = 50;
const DEFAULT_DEPOSITS_COUNT = 5;
const DEFAULT_DEPOSIT_ADDRESSES_COUNT = 5;

export class DepositController {
  private readonly depositRepository = new Repository<Deposit>();
  private readonly depositAddressRepository = new Repository<DepositAddress>();
  private readonly depositCapabilitiesRepository = new Repository<DepositCapability>();
  private readonly swiftCodeRegexp = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
  private readonly ibanRegexp = /^[A-Z]{2}\d{2}[a-zA-Z0-9]{1,30}$/;

  constructor() {
    for (let i = 0; i < DEFAULT_DEPOSITS_COUNT; i++) {
      this.depositRepository.create(fakeSchemaObject('Deposit') as Deposit);
    }

    for (let i = 0; i < DEFAULT_DEPOSIT_ADDRESSES_COUNT; i++) {
      this.depositAddressRepository.create(fakeSchemaObject('DepositAddress') as DepositAddress);
    }

    for (let i = 0; i < DEFAULT_CAPABILITIES_COUNT; i++) {
      this.depositCapabilitiesRepository.create(
        fakeSchemaObject('DepositCapability') as DepositCapability
      );
    }

    const knownAssetIds = AssetsController.getAllAdditionalAssets().map((a) => a.id);

    injectKnownAssetIdsToDeposits(knownAssetIds, this.depositRepository);
    injectKnownAssetIdsToDepositAddresses(knownAssetIds, this.depositAddressRepository);
    injectKnownAssetIdsToDepositCapabilities(knownAssetIds, this.depositCapabilitiesRepository);
  }

  public getDepositCapabilities(): DepositCapability[] {
    return this.depositCapabilitiesRepository.list();
  }

  public getAllDeposits(): Deposit[] {
    return this.depositRepository.list();
  }

  public getDeposit(depositId: string): Deposit {
    const deposit = this.depositRepository.find(depositId);

    if (!deposit) {
      throw new DepositNotFoundError();
    }

    return deposit;
  }

  public validateDepositAddressCreationRequest(
    depositAddressRequest: DepositAddressCreationRequest
  ): void {
    if (!AssetsController.isKnownAsset(depositAddressRequest.transferMethod.asset)) {
      throw new UnknownAdditionalAssetError();
    }
  }

  public depositAddressFromDepositAddressRequest(
    depositAddressRequest: DepositAddressCreationRequest
  ): DepositAddress {
    const { transferMethod } = depositAddressRequest;
    const status = DepositAddressStatus.ENABLED;
    const id = randomUUID();
    let destination: DepositDestination;

    switch (transferMethod.transferMethod) {
      case IbanCapability.transferMethod.IBAN:
        destination = {
          ...transferMethod,
          accountHolder: { name: randomUUID() },
          iban: new RandExp(this.ibanRegexp).gen(),
        };
        break;
      case SwiftCapability.transferMethod.SWIFT:
        destination = {
          ...transferMethod,
          accountHolder: { name: randomUUID() },
          swiftCode: new RandExp(this.swiftCodeRegexp).gen(),
          routingNumber: randomUUID(),
        };
        break;
      case PublicBlockchainCapability.transferMethod.PUBLIC_BLOCKCHAIN:
        destination = {
          ...transferMethod,
          address: randomUUID(),
        };
        break;
    }

    return { id, status, destination };
  }

  public addNewDepositAddress(depositAddress: DepositAddress): void {
    this.depositAddressRepository.create(depositAddress);
  }

  public getDepositAddresses(): DepositAddress[] {
    return this.depositAddressRepository.list();
  }

  public getDepositAddress(depositAddressId: string): DepositAddress {
    const depositAddress = this.depositAddressRepository.find(depositAddressId);

    if (!depositAddress) {
      throw new DepositAddressNotFoundError();
    }

    return depositAddress;
  }

  public disableDepositAddress(depositAddressId: string): DepositAddress {
    const depositAddress = this.depositAddressRepository.find(depositAddressId);

    if (!depositAddress) {
      throw new DepositAddressNotFoundError();
    }
    if (depositAddress.status === DepositAddressStatus.DISABLED) {
      throw new DepositAddressDisabledError(depositAddressId);
    }

    depositAddress.status = DepositAddressStatus.DISABLED;
    return depositAddress;
  }
}

function injectKnownAssetIdsToDeposits(
  knownAssetIds: string[],
  depositRepository: Repository<Deposit>
): void {
  for (const { id } of depositRepository.list()) {
    const deposit = depositRepository.find(id);
    if (!deposit) {
      throw new Error('Not possible!');
    }

    if ('assetId' in deposit.balanceAsset) {
      deposit.balanceAsset.assetId = JSONSchemaFaker.random.pick(knownAssetIds);
    }

    if ('assetId' in deposit.source.asset) {
      deposit.source.asset.assetId = JSONSchemaFaker.random.pick(knownAssetIds);
    }
  }
}

function injectKnownAssetIdsToDepositAddresses(
  knownAssetIds: string[],
  depositAddressRepository: Repository<DepositAddress>
): void {
  for (const { id } of depositAddressRepository.list()) {
    const depositAddress = depositAddressRepository.find(id);
    if (!depositAddress) {
      throw new Error('Not possible!');
    }

    if ('assetId' in depositAddress.destination.asset) {
      depositAddress.destination.asset.assetId = JSONSchemaFaker.random.pick(knownAssetIds);
    }
  }
}

function injectKnownAssetIdsToDepositCapabilities(
  knownAssetIds: string[],
  depositCapabilityRepository: Repository<DepositCapability>
): void {
  for (const { id } of depositCapabilityRepository.list()) {
    const capability = depositCapabilityRepository.find(id);
    if (!capability) {
      throw new Error('Not possible!');
    }

    if ('assetId' in capability.balanceAsset) {
      capability.balanceAsset.assetId = JSONSchemaFaker.random.pick(knownAssetIds);
    }

    if ('assetId' in capability.deposit.asset) {
      capability.deposit.asset.assetId = JSONSchemaFaker.random.pick(knownAssetIds);
    }
  }
}
