const fs = require('fs');

let typesTs = fs.readFileSync('src/types.ts', 'utf8');

const companyInterface = `export interface Company {
  id: string;
  name: string;
  logo_url?: string;
  subscription_status?: string;
  created_at: string;
}

export type UserRole =`;

typesTs = typesTs.replace('export type UserRole =', companyInterface);

// List of interfaces to add company_id to
const interfacesToUpdate = [
  'export interface Profile {',
  'export interface Project {',
  'export interface Allocation {',
  'export interface ExpenseCategory {',
  'export interface Expense {',
  'export interface Supplier {',
  'export interface Subcontractor {',
  'export interface PurchaseRequest {',
  'export interface PurchaseOrder {',
  'export interface Contract {',
  'export interface Stock {',
  'export interface Equipment {',
];

for (const iface of interfacesToUpdate) {
  const replacement = `${iface}\n  company_id?: string;`;
  typesTs = typesTs.replace(iface, replacement);
}

// Add company_name to Profile
typesTs = typesTs.replace(
  `export interface Profile {
  company_id?: string;
  id: string;`,
  `export interface Profile {
  company_id?: string;
  company_name?: string;
  id: string;`
);

fs.writeFileSync('src/types.ts', typesTs);
console.log('Fixed src/types.ts');
