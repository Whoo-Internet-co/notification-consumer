# Notification Consumer

Consumidor mock de notificações da plataforma de autorização financeira. O serviço recebe eventos `TransacaoAutorizada` v1 por Amazon SQS, simula uma notificação e confirma a mensagem apenas após o processamento completo.

## Arquitetura

O projeto combina Clean Architecture e arquitetura hexagonal. Domínio e aplicação não importam AWS SDK. As portas de notificação, idempotência, log e transporte ficam na aplicação ou na borda de entrada; suas implementações ficam nos adapters e na infraestrutura.

```text
src/
├── domain/                 # entidade do evento e erros de domínio
├── application/
│   ├── ports/              # contratos independentes de tecnologia
│   └── use-cases/          # processamento idempotente
├── adapters/
│   ├── inbound/            # validação e consumo SQS
│   └── outbound/           # mock, idempotência em memória e log JSON
├── infrastructure/         # AWS SDK v3 e configuração
└── main.ts                 # composição e graceful shutdown
```

Fluxo de processamento:

```text
EventBridge -> Notification Queue -> Consumer -> validação -> idempotência -> mock
                                              ├─ sucesso: DeleteMessage (ACK)
                                              └─ falha: sem ACK -> redelivery -> DLQ
```

O `InMemoryIdempotencyRepository` atende ao mock e aos testes locais. Em ECS com mais de uma task, substitua-o por armazenamento compartilhado e operação atômica, como DynamoDB com conditional write, sem alterar o caso de uso.

## Contrato

```json
{
  "event_id": "3e513677-e10b-486a-b72f-93b01d60d6df",
  "event_type": "TransacaoAutorizada",
  "event_version": "1.0",
  "occurred_at": "2026-09-23T20:00:00.000Z",
  "id_autorizacao": "auth-123",
  "id_contrato": "contract-456",
  "valor": 100,
  "saldo_reservado": 900,
  "correlation_id": "correlation-789",
  "trace_id": null
}
```

A validação está isolada em um adapter para permitir a troca futura pelo contrato definitivo.

## Execução local

Requer Node.js 22.12 ou superior e credenciais AWS válidas para a fila.

```bash
cp .env.example .env
npm ci
set -a && source .env && set +a
npm run build
npm start
```

Validações:

```bash
npm run lint
npm test
npm run build
```

`SIGTERM` e `SIGINT` interrompem o long polling e encerram o consumidor. Uma falha de parse, contrato ou gateway não executa `DeleteMessage`; visibility timeout, redrive policy e DLQ da SQS controlam novas entregas.

## Docker e ECS/Fargate

```bash
docker build -t notification-consumer .
docker run --rm --env-file .env notification-consumer
```

A imagem usa build em múltiplos estágios e executa como o usuário não privilegiado `node`. No ECS, forneça as variáveis por task definition, conceda `sqs:ReceiveMessage` e `sqs:DeleteMessage` no task role e configure health/replacement pelo estado da task. A fila e sua DLQ devem definir `visibility_timeout_seconds` e `redrive_policy` via Terraform.

## Observabilidade e entrega

Os logs são JSON e carregam `event_id`, `correlation_id` e `trace_id` quando disponíveis. Os workflows em `.github/workflows` validam lint, testes com cobertura, build e imagem Docker; tags `v*` ou execução manual publicam em GHCR usando apenas `GITHUB_TOKEN`.
