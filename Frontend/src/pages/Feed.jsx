import { useState } from 'react';
import FeedPage1 from '../components/Feed/FeedPage1';
import FeedPage2 from '../components/Feed/FeedPage2';
import FeedPage3 from '../components/Feed/FeedPage3';
import CreateAppreciation from '../components/Feed/CreateAppreciation';
import GuardedModal from '../components/ui/GuardedModal';
import { useRef } from 'react';

const Feed = () => {
    const [currentFeedPage, setCurrentFeedPage] = useState(1); // Start on appreciation page (FeedPage2)
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [feedRefreshKey, setFeedRefreshKey] = useState(0);
    const createFormRef = useRef(null);

    const navigateToPage2 = () => {
        setCurrentFeedPage(2);
    };

    const navigateToPage1 = () => {
        setCurrentFeedPage(1);
    };

    const navigateToPage3 = () => {
        setCurrentFeedPage(3);
    };

    const navigateToCreateForm = () => {
        setShowCreateModal(true);
    };

    return (
        <>
            {currentFeedPage === 1 && <FeedPage2 key={feedRefreshKey} onNavigateToPage2={navigateToPage2} onNavigateToPage3={navigateToPage3} onNavigateToCreateForm={navigateToCreateForm} />}
            {currentFeedPage === 2 && <FeedPage1 onNavigateBack={navigateToPage1} onNavigateToCreateForm={navigateToCreateForm} />}
            {currentFeedPage === 3 && <FeedPage3 onNavigateBack={navigateToPage1} />}
            {showCreateModal && (
                <GuardedModal
                    onDiscard={() => setShowCreateModal(false)}
                    onSave={() => createFormRef.current?.requestSubmit()}
                    contentClassName="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-0 shadow-2xl dark:bg-slate-900"
                >
                    <CreateAppreciation
                        externalFormRef={createFormRef}
                        onNavigateBack={() => setShowCreateModal(false)}
                        onSuccess={() => {
                            setShowCreateModal(false);
                            setFeedRefreshKey((key) => key + 1);
                        }}
                    />
                </GuardedModal>
            )}
        </>
    );
};

export default Feed;
