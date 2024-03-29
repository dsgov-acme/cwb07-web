import { PagingResponseModel } from '@dsg/shared/utils/http';
import { TransactionListMock } from '../transaction/transaction.mock';
import { ITransaction, ITransactionsPaginationResponse } from '../transaction/transaction.model';
import { ITransactionDefinition, TransactionDefinitionModel } from './transaction-definition.model';

export const TransactionDefinitionMock: ITransactionDefinition = {
  category: 'application',
  createdTimestamp: '2023-08-10T22:23:48.790109Z',
  defaultFormConfigurationKey: 'FinancialBenefit',
  defaultStatus: 'draft',
  description: 'description',
  entitySchema: 'FinancialBenefit',
  formConfigurationSelectionRules: [],
  id: '74afbd29-4590-4e3d-ba96-92c886045dd5',
  key: 'FinancialBenefit',
  lastUpdatedTimestamp: '2023-09-19T16:22:55.380486Z',
  name: 'Financial Benefit',
  processDefinitionKey: 'test_process',
  schemaKey: 'FinancialBenefit',
};
export const TransactionDefinitionMock2: ITransactionDefinition = {
  category: 'application',
  createdTimestamp: '',
  defaultFormConfigurationKey: '',
  defaultStatus: 'draft',
  description: 'description',
  entitySchema: '',
  formConfigurationSelectionRules: [
    {
      context: 'string',
      formConfigurationKey: 'string',
      task: 'string',
      viewer: 'string',
    },
  ],
  key: 'FinancialBenefit',
  lastUpdatedTimestamp: '',
  name: 'Financial Benefit',
  processDefinitionKey: 'test_process',
  schemaKey: 'FinancialBenefit',
};

export const TransactionDefinitionListMock: ITransactionDefinition[] = [
  {
    category: 'application',
    createdTimestamp: '2023-08-10T22:23:48.790109Z',
    defaultFormConfigurationKey: 'FinancialBenefit',
    defaultStatus: 'draft',
    description: 'description',
    entitySchema: 'FinancialBenefit',
    formConfigurationSelectionRules: [],
    id: 'e4639a26-700e-4043-b18f-0ce440ec961a',
    key: 'financialBenefit',
    lastUpdatedTimestamp: '2023-09-19T16:22:55.380486Z',
    name: 'Financial Benefit',
    processDefinitionKey: 'FinancialBenefitApplication',
    schemaKey: 'FinancialBenefit',
  },
  {
    category: 'complaint.labor_standards',
    createdTimestamp: '2023-09-19T15:52:16.584283Z',
    defaultFormConfigurationKey: 'FinancialBenefit',
    defaultStatus: 'draft',
    description: 'description',
    entitySchema: 'testSchemaDeibys',
    formConfigurationSelectionRules: [
      {
        context: 'string',
        formConfigurationKey: 'string',
        task: 'string',
        viewer: 'string',
      },
    ],
    id: '30c6fcc2-b88f-4656-a963-6e7704835ccc',
    key: 'vehicalRegistration',
    lastUpdatedTimestamp: '2023-09-19T15:52:16.584283Z',
    name: 'Vehical Registration',
    processDefinitionKey: 'FinancialBenefitApplication',
    schemaKey: 'FinancialBenefit',
  },
  {
    category: 'complaint.labor_standards',
    createdTimestamp: '2023-09-19T15:52:59.904805Z',
    defaultFormConfigurationKey: 'FinancialBenefit',
    defaultStatus: 'draft',
    description: 'description',
    entitySchema: 'FinancialBenefit',
    formConfigurationSelectionRules: [
      {
        context: 'string',
        formConfigurationKey: 'string',
        task: 'string',
        viewer: 'string',
      },
    ],
    id: '5b7406e9-0be5-48b7-8c4e-c4e06946a88b',
    key: 'vehicalRegistrationRenewel',
    lastUpdatedTimestamp: '2023-09-19T15:52:59.904805Z',
    name: 'VehicalRegistration Renewel',
    processDefinitionKey: 'FinancialBenefitApplication',
    schemaKey: 'FinancialBenefit',
  },
  {
    category: 'complaint.labor_standards',
    createdTimestamp: '2023-09-19T15:53:53.888586Z',
    defaultFormConfigurationKey: 'FinancialBenefit',
    defaultStatus: 'draft',
    description: 'description',
    entitySchema: 'FinancialBenefit',
    formConfigurationSelectionRules: [
      {
        context: 'string',
        formConfigurationKey: 'string',
        task: 'string',
        viewer: 'string',
      },
    ],
    id: 'fd972808-6709-4590-a44d-6ad4eba4846f',
    key: 'newDriversLicense',
    lastUpdatedTimestamp: '2023-09-19T15:53:53.888586Z',
    name: 'New Drivers License',
    processDefinitionKey: 'FinancialBenefitApplication',
    schemaKey: 'FinancialBenefit',
  },
  {
    category: 'complaint.labor_standards',
    createdTimestamp: '2023-09-19T15:54:54.228821Z',
    defaultFormConfigurationKey: 'FinancialBenefit',
    defaultStatus: 'draft',
    description: 'description',
    entitySchema: 'FinancialBenefit',
    formConfigurationSelectionRules: [
      {
        context: 'string',
        formConfigurationKey: 'string',
        task: 'string',
        viewer: 'string',
      },
    ],
    id: 'e6950131-07c4-4e53-ad62-75a45bde4d54',
    key: 'driverLicenseRenewel',
    lastUpdatedTimestamp: '2023-09-19T15:54:54.228821Z',
    name: 'Driver License Renewel',
    processDefinitionKey: 'FinancialBenefitApplication',
    schemaKey: 'FinancialBenefit',
  },
  {
    category: '',
    createdTimestamp: '2023-09-21T14:16:02.961665Z',
    defaultFormConfigurationKey: 'FinancialBenefit',
    defaultStatus: 'draft',
    description: 'description',
    entitySchema: 'FinancialBenefit',
    formConfigurationSelectionRules: [],
    id: '149db035-5363-4559-87ea-79ecb9b03417',
    key: 'testing123',
    lastUpdatedTimestamp: '2023-09-21T14:16:02.961665Z',
    name: 'Testing123',
    processDefinitionKey: 'FinancialBenefit',
    schemaKey: 'FinancialBenefit',
  },
];

export const TransactionDefinitionModelMock: TransactionDefinitionModel = new TransactionDefinitionModel(TransactionDefinitionMock2);

export const TransactionDefinitionListSchemaMock: ITransactionsPaginationResponse<ITransaction> = {
  items: TransactionListMock,
  pagingMetadata: new PagingResponseModel({
    nextPage: '',
    pageNumber: 1,
    pageSize: 10,
    totalCount: 200,
  }),
};
