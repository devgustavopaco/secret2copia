import styles from "../styles/Politica.module.scss";

export default function Politica() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Política de Privacidade</h1>
      <p>
        Bem-vindo ao Nextgain! Sua privacidade é muito importante para nós, e
        estamos comprometidos em protegê-la. Esta Política de Privacidade
        descreve como coletamos, usamos e protegemos suas informações pessoais
        ao usar nosso site{" "}
        <a href="https://www.nextgain.com.br/">https://www.nextgain.com.br/</a>.
      </p>

      <h2>Informações que Coletamos</h2>
      <p>
        Coletamos apenas as informações necessárias para oferecer nossos
        serviços, como seu nome, e-mail e senha. Não coletamos automaticamente
        outras informações pessoais sem o seu consentimento.
      </p>

      <h2>Como Usamos Suas Informações</h2>
      <p>As informações fornecidas por você são utilizadas para:</p>
      <ul>
        <li>Garantir o acesso seguro à sua conta;</li>
        <li>Melhorar a experiência dos usuários em nossos serviços;</li>
        <li>Personalizar o conteúdo e os serviços oferecidos;</li>
        <li>
          Comunicar atualizações importantes ou informações relacionadas ao
          Nextgain.
        </li>
      </ul>

      <h2>Compartilhamento de Dados</h2>
      <p>
        O Nextgain não compartilha suas informações pessoais com terceiros,
        exceto quando exigido por lei ou quando necessário para cumprir
        solicitações relacionadas ao serviço, como suporte técnico.
      </p>

      <h2>Seus Direitos</h2>
      <p>Você tem o direito de:</p>
      <ul>
        <li>Solicitar acesso às suas informações pessoais;</li>
        <li>Corrigir dados imprecisos;</li>
        <li>Excluir suas informações pessoais, quando permitido.</li>
      </ul>
      <p>
        Para exercer esses direitos, entre em contato conosco através do e-mail
        fornecido abaixo.
      </p>

      <h2>Alterações na Política</h2>
      <p>
        Esta política pode ser atualizada periodicamente para refletir mudanças
        em nossas práticas ou para atender a novas regulamentações. Recomendamos
        revisar esta página regularmente para estar ciente de qualquer
        modificação.
      </p>

      <h2>Contato</h2>
      <p>
        Se você tiver dúvidas, preocupações ou solicitações relacionadas à nossa
        Política de Privacidade, entre em contato conosco pelo e-mail
        <a href="mailto:suporte@nextgain.com.br"> suporte@nextgain.com.br</a>.
      </p>
    </div>
  );
}
