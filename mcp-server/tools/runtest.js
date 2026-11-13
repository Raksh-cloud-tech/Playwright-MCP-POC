import { exec } from "child_process";
export function runTest() {
    return new Promise((resolve) => {
        exec("cd ../playground && npx playwright test", (error, stdout) => {
            resolve(stdout);
            console.log(stdout);
            if (error) {
                console.log(error);
            }
        });
    });
}
