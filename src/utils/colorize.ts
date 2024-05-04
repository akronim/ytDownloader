const colorize = (txt: string, color: string): string => {
    const defaultColor = `\x1b[0m`;
    const code: number | undefined = {
        black: 30,
        blue: 34,
        red: 91,
        green: 92,
        yellow: 93,
        magenta: 95,
        cyan: 96,
        white: 97
    }[color];

    if (code) {
        return `\x1b[${code}m${txt}${defaultColor}`;
    }

    return txt;
};

export default colorize;
