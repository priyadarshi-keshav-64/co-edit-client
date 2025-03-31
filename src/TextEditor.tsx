/// <reference types="vite/client" />

import Quill, { Delta } from 'quill'
import { useCallback, useEffect, useState } from 'react'
import 'quill/dist/quill.snow.css'
import "./styles.css"
import { io, Socket } from 'socket.io-client'
import { useParams } from 'react-router-dom'

const toolbarOptions = [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    ['code-block'],
    ['link', 'image'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'script': 'sub' }, { 'script': 'super' }],

    [{ 'color': [] }, { 'background': [] }],
    [{ 'font': [] }],
    [{ 'align': [] }],

    ['clean']
];

const TextEditor = () => {
    // const editorRef = useRef<HTMLDivElement | null>(null)

    // useEffect(() => {
    //     if (editorRef.current && !editorRef.current.querySelector('.ql-editor')) {
    //         new Quill(editorRef.current, {
    //             theme: 'snow'
    //         })
    //         // sjfndknj
    //     }
    // }, [])
    const [socket, setSocket] = useState<Socket>()
    const [quill, setQuill] = useState<Quill>()
    const { id: roomId } = useParams();

    const wrapperRef = useCallback((wrapper: HTMLDivElement | null) => {
        if (wrapper == null) return
        wrapper.innerHTML = ""
        const editor = document.createElement("div")
        wrapper.append(editor)
        const q = new Quill(editor, {
            theme: "snow", modules: {
                toolbar: toolbarOptions
            }
        })
        q.disable
        // q.setText("Loading your data ...")
        setQuill(q)
    }, [])

    const textChangeHandler = (delta: Delta, _oldContents: Delta, source: string) => {
        if (source !== 'user') return
        socket?.emit('send-changes', delta)
    }

    const updateContentHandler = (data: Delta) => {
        console.log({ broadcastReceived: data })
        quill?.updateContents(data)
    }

    // connect socket server
    useEffect(() => {
        const s = io(import.meta.env.VITE_API_BASE_URL)
        setSocket(s)

        return () => {
            s.disconnect()
        }
    }, [])

    useEffect(() => {
        if (socket == null || quill == null || roomId == null) return

        // listening to the event to load document wrt server data
        socket.once("load-document", document => {
            console.log({ test: document })
            console.log({ test: 1 })
            // quill.setContents(new Delta([{ insert: document }]))
            quill.setContents(document)
            quill.enable()
        })

        // first we fetch document with param id
        socket.emit("get-document", roomId)
    }, [quill, socket, roomId])

    useEffect(() => {
        if (socket == null || quill == null) return
        console.log({ test: 2 })
        quill.on('text-change', textChangeHandler);

        return () => {
            quill.off('text-change', textChangeHandler)
        }
    }, [socket, quill])

    useEffect(() => {
        if (socket == null || quill == null) return
        const interval = setInterval(() => {
            console.log("emitting the content: ", quill.getContents())
            socket.emit('save-document', quill.getContents());
        }, 5000)

        return () => {
            clearInterval(interval)
        }
    }, [socket, quill])

    useEffect(() => {
        if (socket == null || quill == null) return
        socket?.on("receive-changes", updateContentHandler)

        return () => {
            socket.off("receive-changes", updateContentHandler)
        }
    }, [socket, quill])

    return (
        <div className='container' ref={wrapperRef}></div>
    )
}

export default TextEditor
