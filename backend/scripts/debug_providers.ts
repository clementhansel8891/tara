
import { FinanceModule } from './src/core/finance/finance.module';
import { HRModule } from './src/core/hr/hr.module';
import { Reflect } from 'reflect-metadata';

function checkModule(module: any, name: string) {
  console.log(`\n--- Checking ${name} ---`);
  const providers = Reflect.getMetadata('providers', module) || [];
  console.log(`Found ${providers.length} providers.`);
  
  providers.forEach((p: any, i: number) => {
    if (!p) {
      console.error(`[ERROR] Provider at index ${i} is NULL or UNDEFINED`);
      return;
    }

    if (p.useClass === undefined && p.provide && typeof p.provide !== 'string' && typeof p.provide !== 'symbol') {
        // Standard class provider
    }

    if (p.useClass === null || (p.hasOwnProperty('useClass') && p.useClass === undefined)) {
       console.error(`[ERROR] Provider ${p.provide?.name || i} has UNDEFINED useClass`);
    }
    
    if (typeof p === 'function' && p.name === undefined) {
         console.error(`[ERROR] Provider at index ${i} is an anonymous function or undefined class`);
    }
  });

  const controllers = Reflect.getMetadata('controllers', module) || [];
  controllers.forEach((c: any, i: number) => {
    if (!c) console.error(`[ERROR] Controller at index ${i} is UNDEFINED`);
  });
}

try {
  checkModule(FinanceModule, 'FinanceModule');
  checkModule(HRModule, 'HRModule');
  console.log('\nAudit Complete.');
} catch (e) {
  console.error('Audit failed to run due to metadata error:', e.message);
}
