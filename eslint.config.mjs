import { FlatCompat } from "@eslint/eslintrc";
import { globalIgnores } from "eslint/config";

const compat = new FlatCompat({ baseDirectory: process.cwd() });
const eslintConfig = [...compat.extends("next/core-web-vitals", "next/typescript"), globalIgnores([".next/**", "out/**", "next-env.d.ts"])];
export default eslintConfig;
