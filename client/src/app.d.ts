/// <reference types="vite/client" />

declare namespace App {
  interface Error {
    message: string;
  }
}

declare module "*.module.scss" {
  const classes: Record<string, string>;
  export default classes;
}

declare module "*.scss" {
  const stylesheet: string;
  export default stylesheet;
}

export {};
