// ContalinkFrame — embebe el HTML real del sim Contalink (public/sims/*.html)
// en un iframe mismo-origen y le inyecta la DB estática Anexo 24 por
// postMessage. El HTML guarda el catálogo en window.CATALOGO_AGRUPADOR.
import { useCallback, useEffect, useRef } from 'react';
import { CATALOGO_AGRUPADOR, CUENTA_INTERNA_A_AGRUPADOR } from './catalogoAgrupador';

interface Props {
  src: string;
  title: string;
}

export default function ContalinkFrame({ src, title }: Props) {
  const ref = useRef<HTMLIFrameElement | null>(null);

  const enviarCatalogo = useCallback(() => {
    ref.current?.contentWindow?.postMessage(
      { type: 'CATALOGO_AGRUPADOR', catalog: CATALOGO_AGRUPADOR, mapeo: CUENTA_INTERNA_A_AGRUPADOR },
      window.location.origin,
    );
  }, []);

  useEffect(() => {
    const onMsg = (ev: MessageEvent) => {
      if (ev.origin !== window.location.origin) return;
      if (ev.data?.type === 'DIOT_READY') enviarCatalogo();
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [enviarCatalogo]);

  return (
    <iframe
      ref={ref}
      src={src}
      title={title}
      onLoad={enviarCatalogo}
      className="w-full h-full border-0 rounded-xl bg-white"
      style={{ minHeight: '70vh' }}
    />
  );
}
