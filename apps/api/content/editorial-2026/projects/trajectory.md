### A conversation-to-data integration

Trajectory's operators needed to look up drone flight areas, routes, and reservation schedules without navigating several separate systems. The chatbot connects a Japanese-language conversation to structured reservation data; it is an operational integration, not an autonomous flight controller.

### Request flow

1. An operator sends a message through Rocket.Chat.
2. Rocket.Chat forwards the conversation to the Go/Gin ChatBotServer.
3. Amazon Lex V2 identifies the intent and extracts slots such as an area or time range.
4. The server validates the request and maintains the conversation state.
5. A separate Go/Gin reservation resource service supplies the required information over gRPC.
6. The chatbot formats the result and sends a reply to the operator.

This split keeps natural-language interaction separate from reservation-resource access. Lex handles language interpretation; backend services remain responsible for the actual data access and response logic.

### Services and storage

The implementation used Go and Gin for the application services, gRPC for the reservation-resource boundary, and PostgreSQL on Amazon RDS for structured data. MongoDB supported chat data, while Amazon S3 handled attachments. Rocket.Chat provided the conversation interface.

The AWS deployment context included EC2, an Application Load Balancer, Route 53, and CloudWatch. These services belong to the project stack; the reference diagram is illustrative and should not be read as proof of every depicted network or autoscaling configuration.

### Conversation edge cases

The integration work addressed more than the happy path:

- **Free-form input:** preserve the operator's message where a fixed intent flow was insufficient.
- **Time ranges:** handle end times and date-related slots consistently when querying reservations.
- **Session expiry:** avoid treating an expired conversation as an active request.
- **Japanese slot values:** align language interpretation with the resource service's expected input.
- **Error responses:** give the user a meaningful reply when a dependency or query cannot complete.

Administrative filtering and route presentation were also part of the functional checks. These details matter because a technically valid API response can still be confusing or incomplete in a conversation.

### Verification scope

ChatBotServer v0.4.2 passed the eight documented functional test cases. That result supports the tested integration behavior; it does not establish a production availability SLA, a load-test result, or autonomous decision-making capability.
