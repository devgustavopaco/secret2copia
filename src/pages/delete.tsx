import styles from "../styles/DeleteAccount.module.scss";
//
export default function DeleteAccount() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Exclusão de Conta - NextGain</h1>
      <p>
        Bem-vindo à NextGain! Valorizamos sua privacidade e estamos
        comprometidos em proteger seus dados. Caso deseje excluir sua conta e
        todas as informações associadas, siga as etapas abaixo.
      </p>

      <h2>Como Solicitar a Exclusão da Conta</h2>
      <ol className={styles.steps}>
        <li>
          Envie um e-mail para nosso suporte no endereço{" "}
          <a href="mailto:suporte@nextgain.com.br" className={styles.email}>
            suporte@nextgain.com.br
          </a>{" "}
          com o assunto:{" "}
          <strong>&quot;Exclusão de Conta - NextGain&quot;</strong>.
        </li>
        <li>
          No corpo do e-mail, informe os seguintes dados:
          <ul>
            <li>Nome completo</li>
            <li>E-mail cadastrado na conta</li>
            <li>Motivo da solicitação (opcional)</li>
          </ul>
        </li>
        <li>
          Após o envio, nossa equipe responderá em até 5 dias úteis confirmando
          a exclusão ou solicitando mais informações, se necessário.
        </li>
      </ol>
      <h2>Dados Excluídos</h2>
      <p>
        Após a exclusão da conta, os seguintes dados serão removidos
        permanentemente:
      </p>
      <ul className={styles.dataList}>
        <li>Nome de usuário</li>
        <li>E-mail</li>
        <li>Histórico de atividades na plataforma</li>
        <li>Qualquer outro dado pessoal associado</li>
      </ul>
      <p>
        Dados que, por obrigações legais, precisam ser armazenados por um
        período adicional (como registros financeiros), serão mantidos apenas
        pelo período necessário, conforme a legislação vigente.
      </p>
      <h2>Contato</h2>
      <p>
        Para mais informações sobre a exclusão de contas ou outros assuntos,
        entre em contato com nossa equipe pelo e-mail{" "}
        <a href="mailto:suporte@nextgain.com.br" className={styles.email}>
          suporte@nextgain.com.br
        </a>
        .
      </p>
    </div>
  );
}
