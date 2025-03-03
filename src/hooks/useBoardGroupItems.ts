import { useState, useEffect } from "react";
import { showErrorMessage } from "@/helpers/monday-actions";
import { AppContextType } from "@/types/context-type";
import { executeMondayApiCall, MondayApiResponse } from "@/helpers/monday-api-helpers";

export default function useBoardGroupItems(context: AppContextType | undefined, groupId: string | string[]) {
    const [boardGroups, setBoardGroups] = useState<any>();

    // fill second dropdown with groups from board
    useEffect(() => {
        if (!boardGroups && context) {
            const board = context?.iframeContext?.boardId ?? context?.iframeContext?.boardIds ?? [];
            getBoardGroups(board, groupId)
                .then((res: MondayApiResponse) => {
                    if (!res.is_success) {
                        showErrorMessage('Could not get groups from board.', 3000);
                    } else {
                        const groups = res?.data.boards[0].groups;
                        const groupItems = groups.items;
                        setBoardGroups(groupItems);
                    }
                })
                .catch((err: any) => console.error(err));
        }
    }, [context, groupId]);

    return boardGroups;
}


export function getBoardGroupsItems(boardId: number | number[], groupId: string | string[]): Record<string, any> {
    return executeMondayApiCall(
        `query($boardId:[Int!],$groupId:[String!]) { boards(ids:$boardId) { groups(ids:$groupId) { id items{ id name column_values{ id title text}} } } }`,
        {
            variables: { boardId, groupId },
        }
    ).then((res) => {
        if (res?.is_success) {
            return res;
        } else {
            console.error(res);
            showErrorMessage('Could not load groups items', 3000);
        }
    });
}

/**
 * Formats boardGroups to be compatible with dropdown 
 * @param boardGroups Array of groups as returned by the useBoardGroups hook
 * @returns Array of groups compatible with Dropdown component
 */
export function mapBoardGroupsToDropdownOptions(
    boardGroups: { id: string; title: string }[] | undefined
) {
    return boardGroups?.map((group: Record<string, any>) => {
        return { label: group.title, value: group.id };
    });
}