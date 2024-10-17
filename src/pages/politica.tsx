import styles from "../styles/Politica.module.scss";

export default function Politica() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Política de Privacidade</h1>
      <p>
        Bem-vindo ao Nextgain! Valorizamos a privacidade de nossos usuários e
        estamos comprometidos em protegê-la. Esta Política de Privacidade
        explica como coletamos, usamos e protegemos suas informações pessoais ao
        usar nosso site https://Nextgain.vercel.app/.
      </p>

      <h2>Informações Pessoais que Coletamos</h2>
      <p>
        Coletamos apenas as informações essenciais para o acesso ao nosso
        serviço: seu e-mail e senha. Não coletamos automaticamente nenhuma outra
        informação pessoal.
      </p>

      <h2>Como Usamos Suas Informações Pessoais</h2>
      <p>
        As informações que coletamos são usadas exclusivamente para:
        <ul>
          <li>Permitir o seu acesso ao nosso serviço;</li>
          <li>Manter a segurança e a privacidade de sua conta.</li>
        </ul>
      </p>

      <h2>Compartilhamento de Suas Informações Pessoais</h2>
      <p>
        Suas informações pessoais (e-mail e senha) não são compartilhadas com
        terceiros e são usadas exclusivamente internamente para os propósitos
        mencionados acima.
      </p>

      <h2>Seus Direitos</h2>
      <p>
        Você tem o direito de acessar, corrigir ou excluir suas informações
        pessoais armazenadas em nosso sistema. Para exercer esses direitos, por
        favor, entre em contato conosco através do e-mail abaixo.
      </p>

      <h2>Alterações na Política de Privacidade</h2>
      <p>
        De tempos em tempos, podemos atualizar esta política para refletir
        mudanças em nossas práticas de privacidade. Recomendamos que você reveja
        esta página periodicamente para quaisquer mudanças.
      </p>

      <h2>Contato</h2>
      <p>
        Para mais informações sobre nossa política de privacidade, ou se você
        tiver qualquer dúvida ou reclamação, entre em contato conosco pelo
        e-mail suporte@Nextgain.com.br
      </p>
    </div>
  );
}
