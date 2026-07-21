import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default Super Admin
  const superAdminEmail = 'superadmin@secondbrain.com';
  const superAdminPassword = 'SuperAdmin123!';
  const hashedSuperAdminPassword = await bcrypt.hash(superAdminPassword, 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {
      passwordHash: hashedSuperAdminPassword,
      role: 'SUPER_ADMIN',
    },
    create: {
      email: superAdminEmail,
      passwordHash: hashedSuperAdminPassword,
      role: 'SUPER_ADMIN',
    },
  });
  console.log(`Super Admin user created: ${superAdmin.email}`);

  // Create default Admin
  const adminEmail = 'admin@secondbrain.com';
  const adminPassword = 'Admin123!';
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: hashedAdminPassword,
      role: 'ADMIN',
    },
    create: {
      email: adminEmail,
      passwordHash: hashedAdminPassword,
      role: 'ADMIN',
    },
  });
  console.log(`Admin user created: ${admin.email}`);

  // Create default GlobalSettings (id: 1)
  const defaultSettings = await prisma.globalSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      ai_text_key: 'dummy_text_key_change_me',
      ai_text_model: 'gpt-4',
      ai_image_key: 'dummy_image_key_change_me',
      ai_image_model: 'dall-e-3',
      master_template_url: null,
      phase_1_prompt: 'You are a Data Analyst AI. You must clean, deduplicate, and filter products to retain only BPOM certified ones, then categorize them by claim.',
      phase_2_prompt: 'You are a Strategy Sparring AI. Suggest primary and derivative formulations based on data, and challenge the user critically.',
      phase_3_prompt: 'You are a Brand Brainstorm AI. Brainstorm unique product names and composition visual concepts based on competitor style.',
      phase_4_prompt: 'You are a Pitch Deck Compiler AI. Map the structured JSON contexts strictly to the template slides without hallucinating.',
    },
  });
  console.log('Global settings seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
