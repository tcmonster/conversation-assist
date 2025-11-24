import { Conversation, ConversationTag } from "@/providers/conversation-provider";
import { SettingsState } from "@/providers/settings-provider";

export type BackupData = {
    conversations: Record<string, Conversation>;
    tags: Record<string, ConversationTag>;
    activeId: string | null;
    settings: SettingsState;
    timestamp: string;
    version: number;
};

const BACKUP_FILE_NAME = "conversation-assist-backup.json";

export class GithubSyncService {
    private token: string;
    private owner: string;
    private repo: string;

    constructor(token: string, owner: string, repo: string) {
        this.token = token;
        this.owner = owner;
        this.repo = repo;
    }

    private get headers() {
        return {
            Authorization: `Bearer ${this.token}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
        };
    }

    private get url() {
        return `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${BACKUP_FILE_NAME}`;
    }

    async upload(data: BackupData): Promise<void> {
        // 1. Check if file exists to get SHA
        let sha: string | undefined;
        try {
            const checkResponse = await fetch(this.url, {
                headers: this.headers,
                method: "GET",
            });
            if (checkResponse.ok) {
                const fileData = await checkResponse.json();
                sha = fileData.sha;
            }
        } catch (error) {
            // Ignore error, assume file doesn't exist
            console.warn("[sync] Failed to check file existence", error);
        }

        // 2. Prepare content
        const content = JSON.stringify(data, null, 2);
        // Use a browser-compatible way to encode base64 with UTF-8 support
        const encodedContent = btoa(unescape(encodeURIComponent(content)));

        // 3. Upload
        const body = {
            message: `Sync: ${new Date().toISOString()}`,
            content: encodedContent,
            sha,
        };

        const response = await fetch(this.url, {
            method: "PUT",
            headers: this.headers,
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`GitHub API Error: ${response.status} ${errorText}`);
        }
    }

    async download(): Promise<BackupData | null> {
        const response = await fetch(this.url, {
            headers: this.headers,
            method: "GET",
        });

        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`GitHub API Error: ${response.status} ${errorText}`);
        }

        const fileData = await response.json();
        if (fileData.encoding !== "base64") {
            throw new Error("Unsupported encoding: " + fileData.encoding);
        }

        // Decode base64 with UTF-8 support
        const decodedContent = decodeURIComponent(escape(atob(fileData.content)));
        return JSON.parse(decodedContent) as BackupData;
    }
}
