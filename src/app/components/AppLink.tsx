import type { MouseEvent } from 'react';
import { useHref, useLinkClickHandler } from 'react-router-dom';
import { Hyperlink, type HyperlinkProps } from '../../components/Hyperlink/Hyperlink';

type AppLinkProps = Omit<HyperlinkProps, 'href'> & {
  to: string;
  /** Router state passed to the destination (e.g. a pre-filled email). */
  state?: unknown;
};

/** The design-system Hyperlink wired to React Router (client-side navigation, real href for new-tab clicks). */
export function AppLink({ to, state, onClick, ...rest }: AppLinkProps) {
  const href = useHref(to);
  const navigate = useLinkClickHandler<HTMLAnchorElement>(to, { state });
  return (
    <Hyperlink
      {...rest}
      href={href}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e);
        if (!e.defaultPrevented) navigate(e);
      }}
    />
  );
}
