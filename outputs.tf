output "lambda_function_arn" {
  value = aws_lambda_function.sns_to_slack.arn
}

output "lambda_function_name" {
  value = aws_lambda_function.sns_to_slack.function_name
}