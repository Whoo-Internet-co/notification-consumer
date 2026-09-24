export interface AuthorizedTransactionEvent {
  event_id: string;
  event_type: 'TransacaoAutorizada';
  event_version: '1.0';
  occurred_at: string;
  id_autorizacao: string;
  id_contrato: string;
  valor: number;
  saldo_reservado: number;
  correlation_id: string;
  trace_id: string | null;
}
