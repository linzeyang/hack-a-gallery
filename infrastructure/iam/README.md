# IAM Configuration for HackaGallery DynamoDB Access

This directory contains IAM policy documents and setup instructions for configuring DynamoDB access across different deployment platforms.

## Overview

The HackaGallery application requires permissions to read and write data to DynamoDB. The configuration method varies by deployment platform:

- **AWS Amplify**: Uses IAM compute roles (recommended for AWS deployments)
- **Vercel/Netlify**: Uses IAM users with access keys

## IAM Policy Document

The `dynamodb-access-policy.json` file contains the IAM policy that grants the necessary DynamoDB permissions:

- Read operations: `GetItem`, `Query`, `Scan`, `BatchGetItem`
- Write operations: `PutItem`, `UpdateItem`, `DeleteItem`, `BatchWriteItem`
- Metadata operations: `DescribeTable`, `ListTables`

The policy uses wildcard resource patterns to support multiple environments (dev, staging, prod).

## Setup Instructions by Platform

### AWS Amplify (Recommended for AWS)

AWS Amplify uses IAM compute roles for secure, credential-free access to AWS services.

#### Step 1: Deploy the DynamoDB Table

```bash
cd frontend
node scripts/deploy-cloudformation.js prod us-east-1
```

Note the table name from the output (e.g., `hackagallery-prod`).

#### Step 2: Create or Update IAM Compute Role

1. **Navigate to AWS Amplify Console**

   - Go to https://console.aws.amazon.com/amplify/
   - Select your HackaGallery app
   - Go to "App settings" → "Environment variables"

2. **Configure Environment Variables**

   - Add `DYNAMODB_TABLE_NAME` with value from Step 1
   - Add `AWS_REGION` with your deployment region (e.g., `us-east-1`)

3. **Attach IAM Policy to Compute Role**

   **Option A: Using AWS Console**

   a. Go to IAM Console: https://console.aws.amazon.com/iam/

   b. Find your Amplify compute role:

   - Navigate to "Roles"
   - Search for your app name (e.g., `amplify-hackagallery-prod`)
   - The role name typically follows pattern: `amplifyserverless-<app-id>-<branch>-<random>`

   c. Attach the DynamoDB policy:

   - Click on the role
   - Click "Add permissions" → "Create inline policy"
   - Switch to JSON tab
   - Copy contents from `infrastructure/iam/dynamodb-access-policy.json`
   - Click "Review policy"
   - Name it `DynamoDBAccess`
   - Click "Create policy"

   **Option B: Using AWS CLI**

   ```bash
   # Get your Amplify app ID
   aws amplify list-apps --region us-east-1

   # Find the compute role name
   aws amplify get-app --app-id <your-app-id> --region us-east-1

   # Attach the policy
   aws iam put-role-policy \
     --role-name <amplify-role-name> \
     --policy-name DynamoDBAccess \
     --policy-document file://infrastructure/iam/dynamodb-access-policy.json
   ```

#### Step 3: Verify Configuration

1. Trigger a new deployment in Amplify
2. Check the application logs for any permission errors
3. Test the application by creating/viewing events and projects

#### Troubleshooting Amplify

**Error: "User is not authorized to perform: dynamodb:GetItem"**

- Verify the IAM policy is attached to the correct compute role
- Check that the table name in environment variables matches the deployed table
- Ensure the policy resource ARN pattern matches your table name

**Error: "Cannot find module '@aws-sdk/client-dynamodb'"**

- Verify dependencies are installed: `npm install`
- Check that `package.json` includes AWS SDK v3 packages

---

### Vercel

Vercel deployments require AWS credentials stored as environment variables.

#### Step 1: Deploy the DynamoDB Table

```bash
cd frontend
node scripts/deploy-cloudformation.js prod us-east-1
```

Note the table name from the output.

#### Step 2: Create IAM User

1. **Create IAM User via AWS Console**

   a. Go to IAM Console: https://console.aws.amazon.com/iam/

   b. Navigate to "Users" → "Create user"

   c. User details:

   - Username: `hackagallery-vercel-prod`
   - Select "Programmatic access"

   d. Set permissions:

   - Click "Attach policies directly"
   - Click "Create policy"
   - Switch to JSON tab
   - Copy contents from `infrastructure/iam/dynamodb-access-policy.json`
   - Name it `HackaGalleryDynamoDBAccess`
   - Create the policy
   - Go back and attach it to the user

   e. Create user and **save the credentials**:

   - Access Key ID
   - Secret Access Key
   - ⚠️ **Important**: Save these securely - you won't see them again!

2. **Create IAM User via AWS CLI**

   ```bash
   # Create the user
   aws iam create-user --user-name hackagallery-vercel-prod

   # Create the policy
   aws iam create-policy \
     --policy-name HackaGalleryDynamoDBAccess \
     --policy-document file://infrastructure/iam/dynamodb-access-policy.json

   # Attach the policy (replace <account-id> with your AWS account ID)
   aws iam attach-user-policy \
     --user-name hackagallery-vercel-prod \
     --policy-arn arn:aws:iam::<account-id>:policy/HackaGalleryDynamoDBAccess

   # Create access keys
   aws iam create-access-key --user-name hackagallery-vercel-prod
   ```

#### Step 3: Configure Vercel Environment Variables

1. **Navigate to Vercel Dashboard**

   - Go to https://vercel.com/dashboard
   - Select your HackaGallery project
   - Go to "Settings" → "Environment Variables"

2. **Add Environment Variables**

   Add the following variables for the Production environment:

   | Name                    | Value                      | Environment |
   | ----------------------- | -------------------------- | ----------- |
   | `DYNAMODB_TABLE_NAME`   | `hackagallery-prod`        | Production  |
   | `AWS_REGION`            | `us-east-1`                | Production  |
   | `AWS_ACCESS_KEY_ID`     | `<your-access-key-id>`     | Production  |
   | `AWS_SECRET_ACCESS_KEY` | `<your-secret-access-key>` | Production  |

3. **Redeploy**
   - Trigger a new deployment or redeploy the latest production deployment
   - Environment variables are only applied to new deployments

#### Step 4: Verify Configuration

1. Check deployment logs for any AWS credential errors
2. Test the application functionality
3. Monitor Vercel logs for any DynamoDB errors

#### Troubleshooting Vercel

**Error: "CredentialsProviderError: Could not load credentials"**

- Verify all four environment variables are set correctly
- Check for typos in variable names (they are case-sensitive)
- Ensure variables are set for the correct environment (Production)

**Error: "The security token included in the request is invalid"**

- Verify the AWS credentials are correct
- Check that the IAM user still exists and is active
- Regenerate access keys if needed

---

### Netlify

Netlify deployments also require AWS credentials stored as environment variables.

#### Step 1: Deploy the DynamoDB Table

```bash
cd frontend
node scripts/deploy-cloudformation.js prod us-east-1
```

Note the table name from the output.

#### Step 2: Create IAM User

Follow the same IAM user creation steps as Vercel (see above), but use username `hackagallery-netlify-prod`.

Alternatively, you can reuse the same IAM user for both Vercel and Netlify if desired.

#### Step 3: Configure Netlify Environment Variables

1. **Navigate to Netlify Dashboard**

   - Go to https://app.netlify.com/
   - Select your HackaGallery site
   - Go to "Site settings" → "Environment variables"

2. **Add Environment Variables**

   Add the following variables:

   | Key                     | Value                      |
   | ----------------------- | -------------------------- |
   | `DYNAMODB_TABLE_NAME`   | `hackagallery-prod`        |
   | `AWS_REGION`            | `us-east-1`                |
   | `AWS_ACCESS_KEY_ID`     | `<your-access-key-id>`     |
   | `AWS_SECRET_ACCESS_KEY` | `<your-secret-access-key>` |

3. **Redeploy**
   - Trigger a new deployment
   - Environment variables are applied to new builds

#### Step 4: Verify Configuration

1. Check build logs for any AWS credential errors
2. Test the application functionality
3. Monitor Netlify function logs for any DynamoDB errors

#### Troubleshooting Netlify

**Error: "Missing credentials in config"**

- Verify all environment variables are set
- Check variable names match exactly (case-sensitive)
- Clear cache and redeploy: "Deploys" → "Trigger deploy" → "Clear cache and deploy site"

**Error: "Network Failure" when accessing DynamoDB**

- Verify AWS region is correct
- Check that DynamoDB table exists in the specified region
- Ensure IAM policy allows access to the table

---

## Security Best Practices

### Credential Management

1. **Never commit credentials to version control**

   - AWS credentials should only exist in environment variables
   - Add `.env.local` to `.gitignore`

2. **Use least privilege principle**

   - The provided IAM policy grants only necessary DynamoDB permissions
   - Avoid using admin or power user policies

3. **Rotate credentials regularly**

   - For IAM users (Vercel/Netlify), rotate access keys every 90 days
   - Update environment variables after rotation

4. **Use separate credentials per environment**
   - Create separate IAM users for dev, staging, and prod
   - Use different table names per environment

### IAM User Naming Convention

Recommended naming pattern: `hackagallery-<platform>-<environment>`

Examples:

- `hackagallery-vercel-dev`
- `hackagallery-vercel-prod`
- `hackagallery-netlify-dev`
- `hackagallery-netlify-prod`

### Monitoring and Auditing

1. **Enable CloudTrail**

   - Monitor DynamoDB API calls
   - Track who accessed what data and when

2. **Set up CloudWatch Alarms**

   - Alert on unusual access patterns
   - Monitor for throttling or errors

3. **Review IAM Access Analyzer findings**
   - Regularly check for overly permissive policies
   - Remove unused IAM users and roles

---

## Multi-Environment Setup

### Development Environment

For development, use DynamoDB Local instead of AWS credentials:

```bash
# .env.local
DYNAMODB_ENDPOINT=http://localhost:8000
DYNAMODB_TABLE_NAME=hackagallery-local
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=local
AWS_SECRET_ACCESS_KEY=local
```

### Staging Environment

Deploy a separate staging table and use separate credentials:

```bash
# Deploy staging table
node scripts/deploy-cloudformation.js staging us-east-1

# Create staging IAM user
aws iam create-user --user-name hackagallery-vercel-staging
# ... attach policy and create access keys
```

### Production Environment

Use the production table with strict access controls:

```bash
# Deploy production table
node scripts/deploy-cloudformation.js prod us-east-1

# Use separate IAM user with production-only access
```

---

## Verification Checklist

After completing IAM setup, verify the following:

- [ ] DynamoDB table is deployed and accessible
- [ ] Environment variables are configured correctly
- [ ] IAM policy is attached (Amplify) or IAM user is created (Vercel/Netlify)
- [ ] Application can read from DynamoDB (test by viewing events)
- [ ] Application can write to DynamoDB (test by creating an event)
- [ ] No credential errors in deployment logs
- [ ] Health check endpoint returns "healthy" status

---

## Additional Resources

- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [DynamoDB Security](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/security.html)
- [AWS Amplify IAM Roles](https://docs.aws.amazon.com/amplify/latest/userguide/server-side-rendering-amplify.html)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Netlify Environment Variables](https://docs.netlify.com/environment-variables/overview/)

---

## Support

If you encounter issues with IAM configuration:

1. Check the troubleshooting section for your platform above
2. Verify AWS credentials using AWS CLI: `aws sts get-caller-identity`
3. Test DynamoDB access: `aws dynamodb describe-table --table-name hackagallery-prod`
4. Review CloudWatch Logs for detailed error messages
