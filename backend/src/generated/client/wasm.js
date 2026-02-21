
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.2.1
 * Query Engine version: 4123509d24aa4dede1e864b46351bf2790323b69
 */
Prisma.prismaVersion = {
  client: "6.2.1",
  engine: "4123509d24aa4dede1e864b46351bf2790323b69"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.CompanyScalarFieldEnum = {
  id: 'id',
  name: 'name',
  code: 'code',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.LocationScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  name: 'name',
  code: 'code',
  address: 'address',
  type: 'type',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.DepartmentScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  name: 'name',
  code: 'code',
  headId: 'headId',
  description: 'description',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.EmployeeScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  locationId: 'locationId',
  departmentId: 'departmentId',
  firstName: 'firstName',
  lastName: 'lastName',
  email: 'email',
  phone: 'phone',
  userId: 'userId',
  managerId: 'managerId',
  position: 'position',
  employeeCode: 'employeeCode',
  employmentType: 'employmentType',
  baseSalary: 'baseSalary',
  hourlyRate: 'hourlyRate',
  hireDate: 'hireDate',
  terminationDate: 'terminationDate',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.AttendanceRecordScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  employeeId: 'employeeId',
  locationId: 'locationId',
  date: 'date',
  status: 'status',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  abnormalTags: 'abnormalTags',
  policyId: 'policyId',
  requiresAttention: 'requiresAttention',
  shiftId: 'shiftId',
  workDurationMinutes: 'workDurationMinutes',
  checkIn: 'checkIn',
  checkOut: 'checkOut'
};

exports.Prisma.LeaveRequestScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  employeeId: 'employeeId',
  startDate: 'startDate',
  endDate: 'endDate',
  reason: 'reason',
  status: 'status',
  approvedBy: 'approvedBy',
  approvedAt: 'approvedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  approvalId: 'approvalId',
  departmentId: 'departmentId',
  type: 'type'
};

exports.Prisma.PayrollRunScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  periodStart: 'periodStart',
  periodEnd: 'periodEnd',
  payDate: 'payDate',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  approvalId: 'approvalId',
  approvedBy: 'approvedBy',
  exportedAt: 'exportedAt',
  totalEmployees: 'totalEmployees',
  totalGrossPay: 'totalGrossPay',
  totalNetPay: 'totalNetPay'
};

exports.Prisma.PayrollLineScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  payrollRunId: 'payrollRunId',
  employeeId: 'employeeId',
  grossPay: 'grossPay',
  netPay: 'netPay',
  adjustments: 'adjustments',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ContractScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  employeeId: 'employeeId',
  title: 'title',
  type: 'type',
  status: 'status',
  startDate: 'startDate',
  endDate: 'endDate',
  url: 'url',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PerformanceCycleScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  name: 'name',
  status: 'status',
  startDate: 'startDate',
  endDate: 'endDate',
  dueDate: 'dueDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PerformanceReviewScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  cycleId: 'cycleId',
  employeeId: 'employeeId',
  reviewerId: 'reviewerId',
  status: 'status',
  rating: 'rating',
  comments: 'comments',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.JobRequisitionScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  departmentId: 'departmentId',
  title: 'title',
  status: 'status',
  openings: 'openings',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ShiftScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  name: 'name',
  startTime: 'startTime',
  endTime: 'endTime',
  breakDuration: 'breakDuration',
  flexibleWindow: 'flexibleWindow',
  workDays: 'workDays',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ScheduleAssignmentScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  employeeId: 'employeeId',
  shiftId: 'shiftId',
  locationId: 'locationId',
  effectiveDate: 'effectiveDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ShiftSwapRequestScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  requesterId: 'requesterId',
  targetId: 'targetId',
  shiftId: 'shiftId',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EmergencyOverrideScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  employeeId: 'employeeId',
  reason: 'reason',
  startDate: 'startDate',
  endDate: 'endDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TrainingProgramScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  name: 'name',
  status: 'status',
  completionRate: 'completionRate',
  dueDate: 'dueDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TrainingAssignmentScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  programId: 'programId',
  employeeId: 'employeeId',
  status: 'status',
  assignedAt: 'assignedAt',
  completedAt: 'completedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.HRCaseScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  employeeId: 'employeeId',
  departmentId: 'departmentId',
  title: 'title',
  type: 'type',
  status: 'status',
  priority: 'priority',
  ownerId: 'ownerId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StoreScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  locationId: 'locationId',
  name: 'name',
  code: 'code',
  type: 'type',
  status: 'status',
  settings: 'settings',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  managerId: 'managerId',
  phone: 'phone',
  email: 'email',
  timezone: 'timezone',
  operatingHours: 'operatingHours',
  inventoryPoolId: 'inventoryPoolId'
};

exports.Prisma.EcommerceConnectorScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  name: 'name',
  platform: 'platform',
  domain: 'domain',
  apiKey: 'apiKey',
  status: 'status',
  settings: 'settings',
  inventoryPoolId: 'inventoryPoolId',
  managerId: 'managerId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.ProductCategoryScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  name: 'name',
  parentId: 'parentId',
  icon: 'icon',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProductScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  categoryId: 'categoryId',
  name: 'name',
  sku: 'sku',
  barcode: 'barcode',
  description: 'description',
  unit: 'unit',
  basePrice: 'basePrice',
  taxRate: 'taxRate',
  imageUrl: 'imageUrl',
  moduleTags: 'moduleTags',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StockLevelScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  locationId: 'locationId',
  productId: 'productId',
  departmentId: 'departmentId',
  onHand: 'onHand',
  reserved: 'reserved',
  available: 'available',
  minBuffer: 'minBuffer',
  maxCapacity: 'maxCapacity',
  lastStockTakeAt: 'lastStockTakeAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StockMovementScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  productId: 'productId',
  fromLocationId: 'fromLocationId',
  fromDepartmentId: 'fromDepartmentId',
  toLocationId: 'toLocationId',
  toDepartmentId: 'toDepartmentId',
  quantity: 'quantity',
  unitCost: 'unitCost',
  type: 'type',
  referenceId: 'referenceId',
  performedBy: 'performedBy',
  createdAt: 'createdAt'
};

exports.Prisma.RetailCustomerScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  name: 'name',
  email: 'email',
  phone: 'phone',
  address: 'address',
  tier: 'tier',
  points: 'points',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RetailCartScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  customerId: 'customerId',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RetailCartItemScalarFieldEnum = {
  id: 'id',
  cartId: 'cartId',
  productId: 'productId',
  quantity: 'quantity',
  unitPrice: 'unitPrice',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RetailWishlistScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  customerId: 'customerId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RetailWishlistItemScalarFieldEnum = {
  id: 'id',
  wishlistId: 'wishlistId',
  productId: 'productId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RetailCustomerAuthScalarFieldEnum = {
  id: 'id',
  customerId: 'customerId',
  passwordHash: 'passwordHash',
  failedAttempts: 'failedAttempts',
  lastFailedAt: 'lastFailedAt',
  lockedUntil: 'lockedUntil',
  passwordUpdatedAt: 'passwordUpdatedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RetailCustomerSessionScalarFieldEnum = {
  id: 'id',
  customerId: 'customerId',
  companyId: 'companyId',
  tokenHash: 'tokenHash',
  expiresAt: 'expiresAt',
  revokedAt: 'revokedAt',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.POSDeviceScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  storeId: 'storeId',
  name: 'name',
  type: 'type',
  isActive: 'isActive',
  macAddress: 'macAddress',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RetailPromotionScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  title: 'title',
  type: 'type',
  value: 'value',
  startDate: 'startDate',
  endDate: 'endDate',
  status: 'status',
  target: 'target',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RetailChannelScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  name: 'name',
  type: 'type',
  adapterType: 'adapterType',
  status: 'status',
  syncFrequency: 'syncFrequency',
  lastSyncAt: 'lastSyncAt',
  credentials: 'credentials',
  webhookUrl: 'webhookUrl',
  integrationCategory: 'integrationCategory',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RetailOrderScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  storeId: 'storeId',
  deviceId: 'deviceId',
  cashierId: 'cashierId',
  customerId: 'customerId',
  status: 'status',
  subtotal: 'subtotal',
  tax: 'tax',
  totalAmount: 'totalAmount',
  paymentMethod: 'paymentMethod',
  paymentReference: 'paymentReference',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RetailOrderItemScalarFieldEnum = {
  id: 'id',
  orderId: 'orderId',
  productId: 'productId',
  quantity: 'quantity',
  unitPrice: 'unitPrice',
  totalPrice: 'totalPrice',
  discount: 'discount'
};

exports.Prisma.RetailShiftScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  storeId: 'storeId',
  employeeId: 'employeeId',
  startTime: 'startTime',
  endTime: 'endTime',
  openingCash: 'openingCash',
  closingCash: 'closingCash',
  expectedCash: 'expectedCash',
  status: 'status',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RetailGatewayNodeScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  loadBalancerId: 'loadBalancerId',
  nodeName: 'nodeName',
  ipAddress: 'ipAddress',
  port: 'port',
  status: 'status',
  healthScore: 'healthScore',
  lastHeartbeat: 'lastHeartbeat',
  version: 'version',
  region: 'region',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RetailLoadBalancerScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  name: 'name',
  virtualIp: 'virtualIp',
  algorithm: 'algorithm',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ITDeviceScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  locationId: 'locationId',
  ownerId: 'ownerId',
  deviceType: 'deviceType',
  deviceName: 'deviceName',
  serialNumber: 'serialNumber',
  ipAddress: 'ipAddress',
  macAddress: 'macAddress',
  status: 'status',
  lastSeen: 'lastSeen',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ITSystemHealthScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  component: 'component',
  status: 'status',
  latencyMs: 'latencyMs',
  checkedAt: 'checkedAt'
};

exports.Prisma.ITProvisioningRequestScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  employeeId: 'employeeId',
  supplierId: 'supplierId',
  supplierBranchId: 'supplierBranchId',
  type: 'type',
  scope: 'scope',
  reason: 'reason',
  status: 'status',
  requestedBy: 'requestedBy',
  provisionedBy: 'provisionedBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ITSettingScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  key: 'key',
  value: 'value',
  category: 'category',
  isPublic: 'isPublic',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AuditLogScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  module: 'module',
  action: 'action',
  entityType: 'entityType',
  entityId: 'entityId',
  userId: 'userId',
  changes: 'changes',
  metadata: 'metadata',
  createdAt: 'createdAt'
};

exports.Prisma.MoneySourceScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  name: 'name',
  type: 'type',
  currency: 'currency',
  balance: 'balance',
  pendingSettlement: 'pendingSettlement',
  provider: 'provider',
  lastUpdated: 'lastUpdated'
};

exports.Prisma.JournalEntryScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  ref: 'ref',
  description: 'description',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.JournalLineScalarFieldEnum = {
  id: 'id',
  journalEntryId: 'journalEntryId',
  accountCode: 'accountCode',
  description: 'description',
  debit: 'debit',
  credit: 'credit'
};

exports.Prisma.PayableScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  vendorName: 'vendorName',
  amount: 'amount',
  currency: 'currency',
  dueDate: 'dueDate',
  status: 'status',
  workflowId: 'workflowId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ReceivableScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  customerName: 'customerName',
  amount: 'amount',
  currency: 'currency',
  dueDate: 'dueDate',
  status: 'status',
  agingBucket: 'agingBucket',
  workflowId: 'workflowId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FixedAssetScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  description: 'description',
  assetClass: 'assetClass',
  location: 'location',
  department: 'department',
  acquisitionDate: 'acquisitionDate',
  acquisitionCost: 'acquisitionCost',
  usefulLifeYears: 'usefulLifeYears',
  depreciationMethod: 'depreciationMethod',
  residualValue: 'residualValue',
  status: 'status',
  capitalizationDate: 'capitalizationDate',
  accumulatedDepreciation: 'accumulatedDepreciation',
  carryingValue: 'carryingValue',
  revaluationReserve: 'revaluationReserve',
  capexRequestId: 'capexRequestId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CapexRequestScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  assetDescription: 'assetDescription',
  requestedAmount: 'requestedAmount',
  department: 'department',
  projectCode: 'projectCode',
  requestedBy: 'requestedBy',
  status: 'status',
  budgetMatched: 'budgetMatched',
  notes: 'notes',
  currentApprovalStage: 'currentApprovalStage',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TreasuryTransferScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  fromSourceId: 'fromSourceId',
  toSourceId: 'toSourceId',
  amount: 'amount',
  currency: 'currency',
  status: 'status',
  requestedBy: 'requestedBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SettlementRecordScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  sourceId: 'sourceId',
  amount: 'amount',
  currency: 'currency',
  status: 'status',
  reference: 'reference',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SupplierMasterScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  name: 'name',
  taxId: 'taxId',
  complianceStatus: 'complianceStatus',
  globalRating: 'globalRating',
  riskTier: 'riskTier',
  categories: 'categories',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.SupplierBranchScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  supplierId: 'supplierId',
  branchCode: 'branchCode',
  branchName: 'branchName',
  location: 'location',
  leadTimeDays: 'leadTimeDays',
  localRating: 'localRating',
  riskTier: 'riskTier',
  active: 'active',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.SupplierProductScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  supplierId: 'supplierId',
  branchId: 'branchId',
  sku: 'sku',
  name: 'name',
  category: 'category',
  unitPrice: 'unitPrice',
  currency: 'currency',
  qualityScore: 'qualityScore',
  active: 'active',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProcurementRequisitionScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  requesterId: 'requesterId',
  departmentId: 'departmentId',
  branchCode: 'branchCode',
  title: 'title',
  description: 'description',
  category: 'category',
  budgetClass: 'budgetClass',
  amount: 'amount',
  currency: 'currency',
  status: 'status',
  approvals: 'approvals',
  supplierId: 'supplierId',
  supplierBranchId: 'supplierBranchId',
  contractRequired: 'contractRequired',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProcurementDraftPOScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  requisitionId: 'requisitionId',
  branchCode: 'branchCode',
  supplierId: 'supplierId',
  supplierBranchId: 'supplierBranchId',
  contractType: 'contractType',
  status: 'status',
  lineItems: 'lineItems',
  quotedTotal: 'quotedTotal',
  quoteReference: 'quoteReference',
  quoteNotes: 'quoteNotes',
  quoteAttachment: 'quoteAttachment',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProcurementFinalPOScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  requisitionId: 'requisitionId',
  draftPoId: 'draftPoId',
  supplierId: 'supplierId',
  supplierBranchId: 'supplierBranchId',
  branchCode: 'branchCode',
  status: 'status',
  totalAmount: 'totalAmount',
  issuedAt: 'issuedAt',
  expectedDeliveryDate: 'expectedDeliveryDate',
  financeCommitmentId: 'financeCommitmentId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProcurementContractScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  requisitionId: 'requisitionId',
  supplierId: 'supplierId',
  status: 'status',
  legalReviewedBy: 'legalReviewedBy',
  version: 'version',
  signedBySupplier: 'signedBySupplier',
  signedByProcurementHod: 'signedByProcurementHod',
  signedByFinanceHod: 'signedByFinanceHod',
  notes: 'notes',
  attachmentIds: 'attachmentIds',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProcurementReceiptScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  finalPoId: 'finalPoId',
  supplierId: 'supplierId',
  supplierBranchId: 'supplierBranchId',
  receivedAt: 'receivedAt',
  deliveryOnTime: 'deliveryOnTime',
  quantityAccuracy: 'quantityAccuracy',
  qualityScore: 'qualityScore',
  issueCount: 'issueCount',
  invoiceMismatch: 'invoiceMismatch',
  createdAt: 'createdAt'
};

exports.Prisma.ProcurementRatingLogScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  supplierId: 'supplierId',
  supplierBranchId: 'supplierBranchId',
  supplierScore: 'supplierScore',
  productScore: 'productScore',
  riskTier: 'riskTier',
  inputs: 'inputs',
  createdAt: 'createdAt'
};

exports.Prisma.ProcurementRiskSignalScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  code: 'code',
  severity: 'severity',
  status: 'status',
  entityId: 'entityId',
  detail: 'detail',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SupplierPortalMessageScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  supplierId: 'supplierId',
  supplierBranchId: 'supplierBranchId',
  direction: 'direction',
  type: 'type',
  relatedEntityId: 'relatedEntityId',
  content: 'content',
  attachmentName: 'attachmentName',
  createdBy: 'createdBy',
  createdAt: 'createdAt'
};

exports.Prisma.ProcurementAuditEventScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  actorId: 'actorId',
  action: 'action',
  entityType: 'entityType',
  entityId: 'entityId',
  detail: 'detail',
  createdAt: 'createdAt'
};

exports.Prisma.SalesLeadScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  companyName: 'companyName',
  contactName: 'contactName',
  contactEmail: 'contactEmail',
  contactPhone: 'contactPhone',
  source: 'source',
  ownerId: 'ownerId',
  ownerName: 'ownerName',
  score: 'score',
  potentialValue: 'potentialValue',
  currency: 'currency',
  priority: 'priority',
  status: 'status',
  slaDueAt: 'slaDueAt',
  firstResponseAt: 'firstResponseAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SalesOpportunityScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  leadId: 'leadId',
  accountName: 'accountName',
  ownerId: 'ownerId',
  ownerName: 'ownerName',
  stage: 'stage',
  probability: 'probability',
  amount: 'amount',
  currency: 'currency',
  expectedCloseDate: 'expectedCloseDate',
  health: 'health',
  nextAction: 'nextAction',
  lastActivityAt: 'lastActivityAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SalesQuoteScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  opportunityId: 'opportunityId',
  accountName: 'accountName',
  version: 'version',
  amount: 'amount',
  discountPercent: 'discountPercent',
  netAmount: 'netAmount',
  currency: 'currency',
  status: 'status',
  validUntil: 'validUntil',
  approvalBy: 'approvalBy',
  approvalAt: 'approvalAt',
  notes: 'notes',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SalesTimelineEventScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  opportunityId: 'opportunityId',
  leadId: 'leadId',
  channel: 'channel',
  direction: 'direction',
  summary: 'summary',
  detail: 'detail',
  createdBy: 'createdBy',
  createdAt: 'createdAt'
};

exports.Prisma.SalesTaskScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  opportunityId: 'opportunityId',
  leadId: 'leadId',
  title: 'title',
  ownerId: 'ownerId',
  ownerName: 'ownerName',
  status: 'status',
  priority: 'priority',
  dueAt: 'dueAt',
  completedAt: 'completedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SalesAlertScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  type: 'type',
  severity: 'severity',
  entityType: 'entityType',
  entityId: 'entityId',
  message: 'message',
  acknowledged: 'acknowledged',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SalesOrderScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  opportunityId: 'opportunityId',
  quoteId: 'quoteId',
  customerName: 'customerName',
  amount: 'amount',
  currency: 'currency',
  status: 'status',
  inventoryCheck: 'inventoryCheck',
  financeInvoiceId: 'financeInvoiceId',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SalesAuditEventScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  actorId: 'actorId',
  action: 'action',
  entityType: 'entityType',
  entityId: 'entityId',
  detail: 'detail',
  createdAt: 'createdAt'
};

exports.Prisma.PaymentProviderScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  name: 'name',
  channels: 'channels',
  status: 'status',
  maxAmountPerTxn: 'maxAmountPerTxn',
  settlementSlaHours: 'settlementSlaHours',
  priority: 'priority',
  lastHeartbeatAt: 'lastHeartbeatAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PaymentRoutingPolicyScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  name: 'name',
  enabled: 'enabled',
  priorities: 'priorities',
  fallbackProviders: 'fallbackProviders',
  maxRetries: 'maxRetries',
  exponentialBackoffSeconds: 'exponentialBackoffSeconds',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PaymentPosDeviceScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  locationId: 'locationId',
  deviceCode: 'deviceCode',
  approved: 'approved',
  status: 'status',
  providerId: 'providerId',
  lastUsedAt: 'lastUsedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PaymentDevicePoolScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  locationId: 'locationId',
  primaryDeviceId: 'primaryDeviceId',
  fallbackDeviceIds: 'fallbackDeviceIds',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PaymentTransactionScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  externalReference: 'externalReference',
  type: 'type',
  amount: 'amount',
  currency: 'currency',
  destination: 'destination',
  source: 'source',
  channel: 'channel',
  providerId: 'providerId',
  settlementId: 'settlementId',
  evidencePackId: 'evidencePackId',
  idempotencyKey: 'idempotencyKey',
  status: 'status',
  ledgerSyncAt: 'ledgerSyncAt',
  ledgerSyncTriggeredAt: 'ledgerSyncTriggeredAt',
  createdBy: 'createdBy',
  approvedBy: 'approvedBy',
  approvedAt: 'approvedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PaymentRetryAttemptScalarFieldEnum = {
  id: 'id',
  transactionId: 'transactionId',
  attempt: 'attempt',
  attemptedAt: 'attemptedAt',
  providerId: 'providerId',
  result: 'result',
  reason: 'reason'
};

exports.Prisma.PaymentSettlementScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  paymentId: 'paymentId',
  providerReference: 'providerReference',
  status: 'status',
  confirmedAt: 'confirmedAt',
  retryAttempts: 'retryAttempts',
  ledgerSyncTriggeredAt: 'ledgerSyncTriggeredAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PaymentRefundScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  paymentId: 'paymentId',
  type: 'type',
  amount: 'amount',
  reason: 'reason',
  status: 'status',
  requestedBy: 'requestedBy',
  approvedBy: 'approvedBy',
  scheduledAt: 'scheduledAt',
  providerReference: 'providerReference',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PaymentDisputeScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  paymentId: 'paymentId',
  reason: 'reason',
  amount: 'amount',
  status: 'status',
  openedBy: 'openedBy',
  evidence: 'evidence',
  providerCaseId: 'providerCaseId',
  resolution: 'resolution',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PaymentChargebackScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  paymentId: 'paymentId',
  disputeId: 'disputeId',
  amount: 'amount',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PaymentEvidencePackScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  paymentId: 'paymentId',
  providerProof: 'providerProof',
  approvalSignatures: 'approvalSignatures',
  checksum: 'checksum',
  payload: 'payload',
  createdAt: 'createdAt'
};

exports.Prisma.PaymentAuditEventScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  actorId: 'actorId',
  action: 'action',
  entityType: 'entityType',
  entityId: 'entityId',
  detail: 'detail',
  createdAt: 'createdAt'
};

exports.Prisma.InventoryAdjustmentScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  itemId: 'itemId',
  locationId: 'locationId',
  departmentId: 'departmentId',
  requestedDelta: 'requestedDelta',
  reason: 'reason',
  status: 'status',
  requestedBy: 'requestedBy',
  approvedBy: 'approvedBy',
  approvedAt: 'approvedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InventoryAuditCycleScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  locationCode: 'locationCode',
  departmentCode: 'departmentCode',
  scope: 'scope',
  status: 'status',
  expectedValue: 'expectedValue',
  countedValue: 'countedValue',
  varianceValue: 'varianceValue',
  openedBy: 'openedBy',
  closedBy: 'closedBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InventoryAlertScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  type: 'type',
  severity: 'severity',
  status: 'status',
  entityId: 'entityId',
  message: 'message',
  acknowledged: 'acknowledged',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InventoryIntegrationEventScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  target: 'target',
  status: 'status',
  eventType: 'eventType',
  entityId: 'entityId',
  detail: 'detail',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MarketingCampaignScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  name: 'name',
  objective: 'objective',
  channelMix: 'channelMix',
  ownerId: 'ownerId',
  ownerName: 'ownerName',
  budget: 'budget',
  currency: 'currency',
  status: 'status',
  startDate: 'startDate',
  endDate: 'endDate',
  audience: 'audience',
  aiRecommendation: 'aiRecommendation',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MarketingExecutionRunScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  campaignId: 'campaignId',
  channel: 'channel',
  scheduledAt: 'scheduledAt',
  status: 'status',
  leadsGenerated: 'leadsGenerated',
  spend: 'spend',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MarketingLeadScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  campaignId: 'campaignId',
  source: 'source',
  companyName: 'companyName',
  contactName: 'contactName',
  email: 'email',
  phone: 'phone',
  country: 'country',
  industry: 'industry',
  employeeBand: 'employeeBand',
  dedupKey: 'dedupKey',
  score: 'score',
  intent: 'intent',
  status: 'status',
  qualificationReason: 'qualificationReason',
  salesHandoffId: 'salesHandoffId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MarketingNurtureWorkflowScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  name: 'name',
  trigger: 'trigger',
  status: 'status',
  steps: 'steps',
  aiSuggestion: 'aiSuggestion',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MarketingConnectedAccountScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  provider: 'provider',
  accountName: 'accountName',
  status: 'status',
  tokenExpiresAt: 'tokenExpiresAt',
  scopes: 'scopes',
  lastSyncAt: 'lastSyncAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MarketingAttributionScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  campaignId: 'campaignId',
  leadId: 'leadId',
  opportunityId: 'opportunityId',
  revenueAttributed: 'revenueAttributed',
  spend: 'spend',
  roiPercent: 'roiPercent',
  createdAt: 'createdAt'
};

exports.Prisma.MarketingAlertScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  type: 'type',
  severity: 'severity',
  entityType: 'entityType',
  entityId: 'entityId',
  message: 'message',
  acknowledged: 'acknowledged',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MarketingAuditEventScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  actorId: 'actorId',
  action: 'action',
  entityType: 'entityType',
  entityId: 'entityId',
  detail: 'detail',
  createdAt: 'createdAt'
};

exports.Prisma.InventoryPoolScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  name: 'name',
  description: 'description',
  type: 'type',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.InventoryPoolStockScalarFieldEnum = {
  id: 'id',
  poolId: 'poolId',
  productId: 'productId',
  onHand: 'onHand',
  reserved: 'reserved',
  available: 'available',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};


exports.Prisma.ModelName = {
  Company: 'Company',
  Location: 'Location',
  Department: 'Department',
  Employee: 'Employee',
  AttendanceRecord: 'AttendanceRecord',
  LeaveRequest: 'LeaveRequest',
  PayrollRun: 'PayrollRun',
  PayrollLine: 'PayrollLine',
  Contract: 'Contract',
  PerformanceCycle: 'PerformanceCycle',
  PerformanceReview: 'PerformanceReview',
  JobRequisition: 'JobRequisition',
  Shift: 'Shift',
  ScheduleAssignment: 'ScheduleAssignment',
  ShiftSwapRequest: 'ShiftSwapRequest',
  EmergencyOverride: 'EmergencyOverride',
  TrainingProgram: 'TrainingProgram',
  TrainingAssignment: 'TrainingAssignment',
  HRCase: 'HRCase',
  Store: 'Store',
  EcommerceConnector: 'EcommerceConnector',
  ProductCategory: 'ProductCategory',
  Product: 'Product',
  StockLevel: 'StockLevel',
  StockMovement: 'StockMovement',
  RetailCustomer: 'RetailCustomer',
  RetailCart: 'RetailCart',
  RetailCartItem: 'RetailCartItem',
  RetailWishlist: 'RetailWishlist',
  RetailWishlistItem: 'RetailWishlistItem',
  RetailCustomerAuth: 'RetailCustomerAuth',
  RetailCustomerSession: 'RetailCustomerSession',
  POSDevice: 'POSDevice',
  RetailPromotion: 'RetailPromotion',
  RetailChannel: 'RetailChannel',
  RetailOrder: 'RetailOrder',
  RetailOrderItem: 'RetailOrderItem',
  RetailShift: 'RetailShift',
  RetailGatewayNode: 'RetailGatewayNode',
  RetailLoadBalancer: 'RetailLoadBalancer',
  ITDevice: 'ITDevice',
  ITSystemHealth: 'ITSystemHealth',
  ITProvisioningRequest: 'ITProvisioningRequest',
  ITSetting: 'ITSetting',
  AuditLog: 'AuditLog',
  MoneySource: 'MoneySource',
  JournalEntry: 'JournalEntry',
  JournalLine: 'JournalLine',
  Payable: 'Payable',
  Receivable: 'Receivable',
  FixedAsset: 'FixedAsset',
  CapexRequest: 'CapexRequest',
  TreasuryTransfer: 'TreasuryTransfer',
  SettlementRecord: 'SettlementRecord',
  SupplierMaster: 'SupplierMaster',
  SupplierBranch: 'SupplierBranch',
  SupplierProduct: 'SupplierProduct',
  ProcurementRequisition: 'ProcurementRequisition',
  ProcurementDraftPO: 'ProcurementDraftPO',
  ProcurementFinalPO: 'ProcurementFinalPO',
  ProcurementContract: 'ProcurementContract',
  ProcurementReceipt: 'ProcurementReceipt',
  ProcurementRatingLog: 'ProcurementRatingLog',
  ProcurementRiskSignal: 'ProcurementRiskSignal',
  SupplierPortalMessage: 'SupplierPortalMessage',
  ProcurementAuditEvent: 'ProcurementAuditEvent',
  SalesLead: 'SalesLead',
  SalesOpportunity: 'SalesOpportunity',
  SalesQuote: 'SalesQuote',
  SalesTimelineEvent: 'SalesTimelineEvent',
  SalesTask: 'SalesTask',
  SalesAlert: 'SalesAlert',
  SalesOrder: 'SalesOrder',
  SalesAuditEvent: 'SalesAuditEvent',
  PaymentProvider: 'PaymentProvider',
  PaymentRoutingPolicy: 'PaymentRoutingPolicy',
  PaymentPosDevice: 'PaymentPosDevice',
  PaymentDevicePool: 'PaymentDevicePool',
  PaymentTransaction: 'PaymentTransaction',
  PaymentRetryAttempt: 'PaymentRetryAttempt',
  PaymentSettlement: 'PaymentSettlement',
  PaymentRefund: 'PaymentRefund',
  PaymentDispute: 'PaymentDispute',
  PaymentChargeback: 'PaymentChargeback',
  PaymentEvidencePack: 'PaymentEvidencePack',
  PaymentAuditEvent: 'PaymentAuditEvent',
  InventoryAdjustment: 'InventoryAdjustment',
  InventoryAuditCycle: 'InventoryAuditCycle',
  InventoryAlert: 'InventoryAlert',
  InventoryIntegrationEvent: 'InventoryIntegrationEvent',
  MarketingCampaign: 'MarketingCampaign',
  MarketingExecutionRun: 'MarketingExecutionRun',
  MarketingLead: 'MarketingLead',
  MarketingNurtureWorkflow: 'MarketingNurtureWorkflow',
  MarketingConnectedAccount: 'MarketingConnectedAccount',
  MarketingAttribution: 'MarketingAttribution',
  MarketingAlert: 'MarketingAlert',
  MarketingAuditEvent: 'MarketingAuditEvent',
  InventoryPool: 'InventoryPool',
  InventoryPoolStock: 'InventoryPoolStock'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
