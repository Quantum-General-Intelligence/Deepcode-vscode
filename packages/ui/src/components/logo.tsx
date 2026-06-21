import { ComponentProps } from "solid-js"

// kilocode_change start — TakeDeep image logo (replaces OpenCode SVG wordmark)
const src = "/logo.png"

export const Mark = (props: { class?: string }) => {
  return (
    <img
      data-component="logo-mark"
      src={src}
      alt=""
      classList={{ [props.class ?? ""]: !!props.class }}
    />
  )
}

export const Splash = (props: Pick<ComponentProps<"img">, "ref" | "class">) => {
  return (
    <img
      ref={props.ref}
      data-component="logo-splash"
      src={src}
      alt=""
      classList={{ [props.class ?? ""]: !!props.class }}
    />
  )
}

export const Logo = (props: { class?: string }) => {
  return (
    <img
      src={src}
      alt="TakeDeep"
      classList={{ [props.class ?? ""]: !!props.class }}
    />
  )
}
// kilocode_change end
