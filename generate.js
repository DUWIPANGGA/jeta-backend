const fs = require('fs');
const path = require('path');

function toKebabCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function toCamelCase(str) {
  const s = str.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function toPascalCase(str) {
  const camel = toCamelCase(toKebabCase(str));
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

const schema = fs.readFileSync(path.join(__dirname, 'prisma/schema.prisma'), 'utf-8');
const modelRegex = /model\s+([A-Za-z0-9_]+)\s+{/g;
let match;
const models = [];

while ((match = modelRegex.exec(schema)) !== null) {
  models.push(match[1]);
}

const srcDir = path.join(__dirname, 'src');

let appModuleImports = [];
let appModuleModules = [];

for (const model of models) {
  // Ignore specific models if needed, e.g., Session, PasswordResetToken
  if (['Session', 'PasswordResetToken'].includes(model)) continue;

  const kebabName = toKebabCase(model) + 's';
  const pascalName = toPascalCase(model);
  const pascalNamePlural = pascalName + 's';
  const camelName = toCamelCase(model);
  const camelNamePlural = camelName + 's';

  const dir = path.join(srcDir, kebabName);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // Module
  const moduleFile = path.join(dir, `${kebabName}.module.ts`);
  fs.writeFileSync(moduleFile, `import { Module } from '@nestjs/common';
import { ${pascalNamePlural}Service } from './${kebabName}.service';
import { ${pascalNamePlural}Controller } from './${kebabName}.controller';

@Module({
  controllers: [${pascalNamePlural}Controller],
  providers: [${pascalNamePlural}Service],
  exports: [${pascalNamePlural}Service],
})
export class ${pascalNamePlural}Module {}
`);

  appModuleImports.push(`import { ${pascalNamePlural}Module } from './${kebabName}/${kebabName}.module';`);
  appModuleModules.push(`${pascalNamePlural}Module`);

  // Controller
  const controllerFile = path.join(dir, `${kebabName}.controller.ts`);
  fs.writeFileSync(controllerFile, `import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ${pascalNamePlural}Service } from './${kebabName}.service';

@Controller('${kebabName}')
export class ${pascalNamePlural}Controller {
  constructor(private readonly ${camelNamePlural}Service: ${pascalNamePlural}Service) {}

  @Post()
  create(@Body() createDto: any) {
    return this.${camelNamePlural}Service.create(createDto);
  }

  @Get()
  findAll() {
    return this.${camelNamePlural}Service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.${camelNamePlural}Service.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.${camelNamePlural}Service.update(+id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.${camelNamePlural}Service.remove(+id);
  }
}
`);

  // Service
  const serviceFile = path.join(dir, `${kebabName}.service.ts`);
  fs.writeFileSync(serviceFile, `import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ${pascalNamePlural}Service {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: any) {
    return this.prisma.${camelName}.create({ data: dto });
  }

  findAll() {
    return this.prisma.${camelName}.findMany();
  }

  async findOne(id: number) {
    const item = await this.prisma.${camelName}.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(\`${pascalName} #\${id} not found\`);
    return item;
  }

  async update(id: number, dto: any) {
    await this.findOne(id);
    return this.prisma.${camelName}.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.${camelName}.delete({ where: { id } });
    return { message: \`${pascalName} #\${id} successfully deleted\` };
  }
}
`);
}

// Update app.module.ts
const appModulePath = path.join(srcDir, 'app.module.ts');
let appModuleContent = `import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
${appModuleImports.join('\n')}

@Module({
  imports: [
    PrismaModule,
${appModuleModules.map(m => '    ' + m + ',').join('\n')}
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
`;
fs.writeFileSync(appModulePath, appModuleContent);

console.log("Resources generated successfully!");
