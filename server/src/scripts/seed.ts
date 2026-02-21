import dotenv from 'dotenv'
import { connectDB, disconnectDB } from '../config/db'
import User from '../models/user.model'
import { UserRole } from '../../../shared/src/user.types'

// Load environment variables
dotenv.config()

async function seedAdmin () {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...')
    await connectDB()
    console.log('✅ Connected to MongoDB')

    // Get admin credentials from environment or use defaults
    const adminEmail =
      process.env.ADMIN_EMAIL || 'admin@bustrack.com'
    const adminPassword =
      process.env.ADMIN_PASSWORD || 'admin123'
    const adminName = process.env.ADMIN_NAME || 'Administrator'

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      email: adminEmail.toLowerCase(),
      role: UserRole.ADMIN
    })

    if (existingAdmin) {
      console.log(`⚠️  Admin account with email "${adminEmail}" already exists.`)
      console.log('   Skipping seed...')
      await disconnectDB()
      process.exit(0)
    }

    // Create admin user
    console.log(`Creating admin account...`)
    console.log(`   Email: ${adminEmail}`)
    console.log(`   Name: ${adminName}`)
    console.log(`   Password: ${adminPassword}`)

    const admin = await User.create({
      email: adminEmail.toLowerCase(),
      password: adminPassword,
      name: adminName,
      role: UserRole.ADMIN,
      isApproved: true,
      isEmailVerified: true
    })

    console.log('✅ Admin account created successfully!')
    console.log(`   ID: ${admin._id}`)
    console.log(`   Email: ${admin.email}`)
    console.log(`   Role: ${admin.role}`)
    console.log('\n⚠️  Remember to change the default password after first login!')

    await disconnectDB()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding admin account:', error)
    await disconnectDB()
    process.exit(1)
  }
}

// Run the seed
seedAdmin()
