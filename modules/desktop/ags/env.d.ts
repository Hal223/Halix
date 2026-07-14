declare const SRC: string

declare module "inline:*" {
  const content: string
  export default content
}

declare module "*.scss" {
  const content: string
  export default content
}

declare module "*.blp" {
  const content: string
  export default content
}

declare module "*.css" {
  const content: string
  export default content
}

declare module "gi://AstalHyprland" {
  const content: any
  export default content
}

declare module "gi://AstalWp" {
  const content: any
  export default content
}

declare module "gi://AstalTray" {
  const content: any
  export default content
}
