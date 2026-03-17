'use client'
import { createContext, useContext, useState, ReactNode, FC, useEffect } from 'react'
import { usePathname } from 'next/navigation'

type Modal = 'None' | 'Create Library' | 'Account Dropdown' | 'Loading' | 'Delete Room' | 'Teleport' | 'Delete Library' | 'Skin' 

type ErrorModal = 'None' | 'Failed To Connect' | 'Disconnected'

type RoomToDelete = {
    name: string,
    index: number
}

type LibraryToDelete = {
    name: string,
    id: string
}

type ModalContextType = {
    modal: Modal,
    setModal: (value: Modal) => void,
    roomToDelete: RoomToDelete,
    setRoomToDelete: (value: RoomToDelete) => void,
    roomList: string[],
    setRoomList: (value: string[]) => void
    libraryToDelete: LibraryToDelete,
    setLibraryToDelete: (value: LibraryToDelete) => void,
    loadingText: string,
    setLoadingText: (value: string) => void
    failedConnectionMessage: string,
    setFailedConnectionMessage: (value: string) => void
    disconnectedMessage: string,
    setDisconnectedMessage: (value: string) => void
    errorModal: ErrorModal,
    setErrorModal: (value: ErrorModal) => void
}

const ModalContext = createContext<ModalContextType>({
    modal: 'None',
    setModal: () => {},
    roomToDelete: {
        name: '',
        index: 0
    },
    setRoomToDelete: () => {},
    roomList: [],
    setRoomList: () => {},
    libraryToDelete: {
        name: '',
        id: ''
    },
    setLibraryToDelete: () => {},
    loadingText: '',
    setLoadingText: () => {},
    failedConnectionMessage: '',
    setFailedConnectionMessage: () => {},
    disconnectedMessage: '',
    setDisconnectedMessage: () => {},
    errorModal: 'None',
    setErrorModal: () => {}
})

type ModalProviderProps = {
    children: ReactNode
}

export const ModalProvider: FC<ModalProviderProps> = ({ children }) => {
    const [modal, setModal] = useState<Modal>('None')
    const [roomToDelete, setRoomToDelete] = useState<RoomToDelete>({
        name: '',
        index: 0
    })
    const [roomList, setRoomList] = useState<string[]>([])
    const [libraryToDelete, setLibraryToDelete] = useState<LibraryToDelete>({
        name: '',
        id: ''
    })
    const [loadingText, setLoadingText] = useState<string>('')
    const [failedConnectionMessage, setFailedConnectionMessage] = useState<string>('')
    const [disconnectedMessage, setDisconnectedMessage] = useState<string>('')
    const [errorModal, setErrorModal] = useState<ErrorModal>('None')
    const pathname = usePathname()

    const value: ModalContextType = { 
        modal, 
        setModal, 
        roomToDelete, 
        setRoomToDelete, 
        roomList, setRoomList, 
        libraryToDelete, 
        setLibraryToDelete, 
        loadingText, 
        setLoadingText, 
        failedConnectionMessage, 
        setFailedConnectionMessage, 
        disconnectedMessage, 
        setDisconnectedMessage,
        errorModal,
        setErrorModal,
    }

    useEffect(() => {
        if (modal !== 'None') {
            setModal('None')   
        }

        if (errorModal !== 'None') {
            setErrorModal('None')
        }
    }, [pathname])

    return (
        <ModalContext.Provider value={value}>
            {children}
        </ModalContext.Provider>
    )
}

export const useModal = () => useContext(ModalContext)
