# HackaGallery Infrastructure

This directory contains infrastructure-as-code templates for deploying HackaGallery's DynamoDB resources.

## Quick Start

Deploy the DynamoDB table using the automated deployment script:

```bash
# Deploy to development environment
npm run deploy:cloudformation dev us-east-1

# Deploy to production environment
npm run deploy:cloudformation prod us-east-1
```

The script will:
- Create or update the CloudFormation stack
- Wait for deployment to complete
- Display table name and ARN
- Provide environment variable configuration

## CloudFormation Template

The `cloudformation/dynamodb-table.yaml` template creates:

- DynamoDB table with single-table design
- Primary key: PK (partition key) and SK (sort key)
- GSI1: Alternate access patterns (by organizer, by hacker, by email)
- GSI2: Role-based queries (by user role)
- Pay-per-request billing mode
- Point-in-time recovery enabled

### Deploying the CloudFormation Stack

#### Using the Deployment Script (Recommended)

```bash
# Syntax: npm run deploy:cloudformation [environment] [region]

# Deploy to development
npm run deploy:cloudformation dev us-east-1

# Deploy to staging
npm run deploy:cloudformation staging us-west-2

# Deploy to production
npm run deploy:cloudformation prod us-east-1
```

The deployment script (`scripts/deploy-cloudformation.js`) provides:
- Automatic stack creation or update detection
- Progress monitoring with status updates
- Formatted output of table name and ARN
- Error handling with helpful troubleshooting tips

#### Using AWS CLI

```bash
# Deploy to development environment
aws cloudformation create-stack \
  --stack-name hackagallery-dynamodb-dev \
  --template-body file://cloudformation/dynamodb-table.yaml \
  --parameters ParameterKey=Environment,ParameterValue=dev \
  --region us-west-2

# Deploy to production environment
aws cloudformation create-stack \
  --stack-name hackagallery-dynamodb-prod \
  --template-body file://cloudformation/dynamodb-table.yaml \
  --parameters ParameterKey=Environment,ParameterValue=prod \
  --region us-west-2
```

#### Using AWS Console

1. Go to AWS CloudFormation console
2. Click "Create stack" → "With new resources"
3. Upload the `cloudformation/dynamodb-table.yaml` file
4. Enter stack name (e.g., `hackagallery-dynamodb-prod`)
5. Select environment parameter (dev, staging, or prod)
6. Review and create

### Stack Outputs

After deployment, the stack provides:

- **TableName**: The name of the created DynamoDB table
- **TableArn**: The ARN of the table (for IAM policies)

### Updating the Stack

```bash
aws cloudformation update-stack \
  --stack-name hackagallery-dynamodb-prod \
  --template-body file://cloudformation/dynamodb-table.yaml \
  --parameters ParameterKey=Environment,ParameterValue=prod \
  --region us-west-2
```

### Deleting the Stack

⚠️ **Warning**: This will delete the table and all data!

```bash
aws cloudformation delete-stack \
  --stack-name hackagallery-dynamodb-prod \
  --region us-west-2
```

## IAM Configuration

After deploying the DynamoDB table, you need to configure IAM permissions for your application to access it.

**📖 See [iam/README.md](./iam/README.md) for detailed setup instructions for:**
- AWS Amplify (using IAM compute roles)
- Vercel (using IAM users with access keys)
- Netlify (using IAM users with access keys)

### Quick Reference

**IAM Policy Document**: `iam/dynamodb-access-policy.json`

**AWS Amplify**: Attach the policy to your Amplify compute role

**Vercel/Netlify**: Create an IAM user, attach the policy, and configure environment variables:
- `DYNAMODB_TABLE_NAME`: Table name from stack outputs
- `AWS_REGION`: Your deployment region
- `AWS_ACCESS_KEY_ID`: IAM user access key
- `AWS_SECRET_ACCESS_KEY`: IAM user secret key

## Cost Estimation

With pay-per-request billing:

- **Writes**: $1.25 per million write request units
- **Reads**: $0.25 per million read request units
- **Storage**: $0.25 per GB-month

Example monthly costs for a small application:
- 100,000 reads/month: $0.025
- 10,000 writes/month: $0.0125
- 1 GB storage: $0.25
- **Total**: ~$0.29/month

For production applications with higher traffic, monitor costs in AWS Cost Explorer.

## Monitoring

Key CloudWatch metrics to monitor:

- `ConsumedReadCapacityUnits` / `ConsumedWriteCapacityUnits`
- `UserErrors` (4xx errors)
- `SystemErrors` (5xx errors)
- `ThrottledRequests`
- `SuccessfulRequestLatency`

Set up CloudWatch alarms for:
- High error rates
- Throttling events
- Unusual latency spikes

## Backup and Recovery

The CloudFormation template enables point-in-time recovery (PITR), which:

- Provides continuous backups for the last 35 days
- Allows restore to any point in time within the backup window
- Incurs additional costs (~$0.20 per GB-month)

To restore from a backup:

```bash
aws dynamodb restore-table-to-point-in-time \
  --source-table-name hackagallery-prod \
  --target-table-name hackagallery-prod-restored \
  --restore-date-time 2024-01-15T10:00:00Z
```

## Security Best Practices

1. **Use IAM roles** instead of access keys when possible (AWS Amplify)
2. **Rotate access keys** regularly for non-AWS platforms
3. **Enable CloudTrail** to audit DynamoDB API calls
4. **Use VPC endpoints** for private connectivity (advanced)
5. **Implement least privilege** - only grant necessary permissions
6. **Monitor access patterns** for unusual activity

## Troubleshooting

### Table Creation Fails

- Check IAM permissions for CloudFormation
- Verify table name doesn't already exist
- Check AWS service quotas for DynamoDB

### Application Can't Connect

- Verify environment variables are set correctly
- Check IAM role/user has necessary permissions
- Verify table exists in the correct region
- Check security group rules (if using VPC endpoints)

### High Costs

- Review access patterns - are you using Scan instead of Query?
- Check for inefficient queries or excessive reads
- Consider using on-demand vs provisioned capacity
- Review CloudWatch metrics to identify hot partitions
