#!/bin/bash

echo "Deploying CloudFront infrastructure..."

aws cloudformation deploy \
  --template-file aws-infrastructure.yml \
  --stack-name cobnb-cloudfront-proxy \
  --capabilities CAPABILITY_IAM \
  --region ap-southeast-1

if [ $? -eq 0 ]; then
  echo "Deployment successful!"
  echo "Fetching CloudFront Domain Name..."
  aws cloudformation describe-stacks \
    --stack-name cobnb-cloudfront-proxy \
    --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDomain'].OutputValue" \
    --output text \
    --region ap-southeast-1
else
  echo "Deployment failed."
fi
