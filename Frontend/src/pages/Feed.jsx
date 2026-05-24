import { useState } from 'react';
import FeedPage1 from '../components/Feed/FeedPage1';
import FeedPage2 from '../components/Feed/FeedPage2';
import FeedPage3 from '../components/Feed/FeedPage3';
import CreateAppreciation from '../components/Feed/CreateAppreciation';

const Feed = () => {
    const [currentFeedPage, setCurrentFeedPage] = useState(1); // Start on appreciation page (FeedPage2)

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
        setCurrentFeedPage(4);
    };

    return (
        <>
            {currentFeedPage === 1 && <FeedPage2 onNavigateToPage2={navigateToPage2} onNavigateToPage3={navigateToPage3} onNavigateToCreateForm={navigateToCreateForm} />}
            {currentFeedPage === 2 && <FeedPage1 onNavigateBack={navigateToPage1} onNavigateToCreateForm={navigateToCreateForm} />}
            {currentFeedPage === 3 && <FeedPage3 onNavigateBack={navigateToPage1} />}
            {currentFeedPage === 4 && <CreateAppreciation onNavigateBack={navigateToPage1} />}
        </>
    );
};

export default Feed;