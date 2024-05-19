'use client'
import { useState, useEffect, forwardRef, useImperativeHandle } from "react";


import CodeMirror from '@uiw/react-codemirror';
import { createTheme } from '@uiw/codemirror-themes';
import { javascript } from '@codemirror/lang-javascript';
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { tags as t } from '@lezer/highlight';

import { EditorState } from '@codemirror/state';
import { material } from '@uiw/codemirror-theme-material';

function getFileExtension(fileName) {
    let ext = fileName.split('.').pop();
    ext = ext.toLowerCase();
    return ext;
}



const myTheme = createTheme({
    dark: 'light',
    settings: {
        background: '#0000',
        backgroundImage: '',
        foreground: '#4D4D4C',
        caret: '#AEAFAD',
        selection: '#D6D6D6',
        selectionMatch: '#D6D6D6',
        gutterBackground: '#FFFFFF',
        gutterForeground: '#4D4D4C',
        gutterBorder: '#dddddd',
        gutterActiveForeground: '',
        lineHighlight: '#EFEFEF',
    },
    styles: [
        { tag: t.comment, color: '#787b80' },
        { tag: t.definition(t.typeName), color: '#194a7b' },
        { tag: t.typeName, color: '#194a7b' },
        { tag: t.tagName, color: '#008a02' },
        { tag: t.variableName, color: '#1a00db' },
    ],
});

const fileTypesFunc = {
    js: () => javascript({ jsx: true }),
    html: () => html(),
    css: () => css(),
}

//************************************************
// for forwardRef component specify displayName
// at the end of the component
// eg: CodeEditor.displayName = 'CodeEditor';
//************************************************

export const CodeEditor = forwardRef((props, ref) => {
    const { file, height } = props;

    const [fileType, setFileType] = useState('');
    const [fileName, setFileName] = useState('');
    const [fileContent, setFileContent] = useState('');
    const [fileExtension, setFileExtension] = useState('js');


    //border radious 
    useEffect(() => {
        const editor = document.querySelector('.cm-editor');
        if (editor) {
            editor.style.borderRadius = '5px';
        }
        const rightPanel = document.querySelector('.cm-gutters');
        if (rightPanel) {
            rightPanel.style.borderRadius = '5px';
        }
    }, []);


    // This method can be called from the parent component to get the latest content
    useImperativeHandle(ref, () => ({
        getLatestContent: () => {
            return {
                content: fileContent,
                name: fileName,
            }
        }
    }));

    useEffect(() => {
        if (file) {
            const _fileName = file.name || 'aa.js';
            const _fileExt = getFileExtension(_fileName);
            const _fileContent = file.content || '';

            if (_fileExt && _fileExt !== fileExtension) {
                setFileExtension(_fileExt);
            }

            if (_fileContent && _fileContent !== fileContent) {
                setFileContent(_fileContent);
            }
        }
    }, [file]);

    const style = {
        borderRadius: '5px',
        boxShadow: 'rgba(99, 99, 99, 0.2) 0px 2px 8px 0px',
    }
    // box-shadow: rgba(99, 99, 99, 0.2) 0px 2px 8px 0px;
    return (
        <CodeMirror
            value={fileContent}
            height={height || '450px'}
            theme={material}
            style={style}
            // extensions={[javascript({ jsx: true })]}
            extensions={
                fileTypesFunc[fileExtension]
                    ? [fileTypesFunc[fileExtension]()]
                    : []
            }
            onChange={(value, viewUpdate) => {
                setFileContent(value);
            }}
        />
    );
})


//set display name 
CodeEditor.displayName = 'CodeEditor';
