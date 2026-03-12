import FsProvider from '../providers/generic/file/FsProvider';
import path from '../providers/node/path/path';
import TcliBridge from '../r2mm/tcli/TcliBridge';

export type ConfigurationFile = {
    filename: string;
    path: string;
    sections: ConfigurationSection[];
}

export type ConfigurationSection = {
    sectionName: string;
    entries: ConfigurationEntry[];
}

export type ConfigurationEntryDisplayType = 'input' | 'single-select' | 'multi-select' | 'boolean';
export type ConfigurationEntry = {
    entryName: string;
    commentLines: CommentLine[];
    // Value since last load
    cachedValue: string;
    // Can be modified but not saved to disk
    value: string;
    displayType: ConfigurationEntryDisplayType;
}

export type CommentLine = {
    isDescription: boolean;
    displayValue: string;
    rawValue: string;
}

export async function buildConfigurationFileFromPath(filePath: string): Promise<ConfigurationFile> {
    return await TcliBridge.invoke<ConfigurationFile>(['config', 'parse', filePath]);
}

export function getSelectOptions(entry: ConfigurationEntry): string[] {
    if (entry.displayType === "boolean") {
        return ["true", "false"];
    }
    if (!['single-select', 'multi-select'].includes(entry.displayType)) {
        throw new Error(`Invalid display type for select options. Got [${entry.displayType}] for entry: ${entry.entryName}`);
    }
    const acceptableValuesComment = entry.commentLines.find(value => value.rawValue.includes("# Acceptable values:"));
    if (!acceptableValuesComment) {
        throw new Error(`Could not find metadata comment for acceptable values on entry: ${entry.entryName}`);
    }
    return acceptableValuesComment.rawValue.substring("# Acceptable values: ".length).split(",").map(value => value.trim()).sort();
}

export async function saveConfigurationFile(configurationFile: ConfigurationFile) {
    let writeString = "";
    for (const section of configurationFile.sections) {
        if (section.sectionName.trim().length > 0) {
            writeString += `[${section.sectionName}]\n\n`;
        }
        for (let entry of section.entries) {
            const comments = entry.commentLines.map(value => value.rawValue).join("\n")
            if (comments.length > 0) {
                writeString += `${comments}\n`
            }
            writeString += `${entry.entryName} = ${entry.value}\n\n`;
        }
    }
    await FsProvider.instance.writeFile(configurationFile.path, writeString);
}
