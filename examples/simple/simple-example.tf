provider "aws" {
  version = "~> 3.0"
  region  = "us-west-2"
}

module "sns_slack_lambda" {
  source = "github.com/byu-oit/terraform-aws-sns-slack-lambda?ref=v1.0.2"
  #source = "../" # for local testing during module development
}
