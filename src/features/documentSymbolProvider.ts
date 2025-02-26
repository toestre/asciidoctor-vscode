/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { AsciidocEngine } from '../asciidocEngine';
import { TableOfContentsProvider, SkinnyTextDocument, TocEntry } from '../tableOfContentsProvider';

interface AsciidocSymbol {
	readonly level: number;
	readonly parent: AsciidocSymbol | undefined;
	readonly children: vscode.DocumentSymbol[];
}

export default class AdocDocumentSymbolProvider implements vscode.DocumentSymbolProvider {

	constructor(
		private readonly engine: AsciidocEngine
	) { }

	public async provideDocumentSymbolInformation(document: SkinnyTextDocument): Promise<vscode.SymbolInformation[]> {
		const toc = await new TableOfContentsProvider(this.engine, document).getToc();
		return toc.map(entry => this.toSymbolInformation(entry));
	}

	public async provideDocumentSymbols(document: SkinnyTextDocument): Promise<vscode.DocumentSymbol[]> {
		const toc = await new TableOfContentsProvider(this.engine, document).getToc();
		const root: AsciidocSymbol = {
			level: -Infinity,
			children: [],
			parent: undefined
		};
		this.buildTree(root, toc);
		return root.children;
	}

	private buildTree(parent: AsciidocSymbol, entries: TocEntry[]) {
		if (!entries.length) {
			return;
		}

		const entry = entries[0];
		const symbol = this.toDocumentSymbol(entry);
		symbol.children = [];

		while (parent && entry.level <= parent.level) {
			parent = parent.parent!;
		}
		parent.children.push(symbol);
		this.buildTree({ level: entry.level, children: symbol.children, parent }, entries.slice(1));
	}


	private toSymbolInformation(entry: TocEntry): vscode.SymbolInformation {
		return new vscode.SymbolInformation(
			entry.text,
			vscode.SymbolKind.String,
			'',
			entry.location);
	}

	private toDocumentSymbol(entry: TocEntry) {
		return new vscode.DocumentSymbol(
			entry.text,
			'',
			vscode.SymbolKind.String,
			entry.location.range,
			entry.location.range);
	}

}
