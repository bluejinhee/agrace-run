// AWS ?�정 ?�일
const AWS_CONFIG = {
    API_ENDPOINT: 'https://o2mtkd2asa.execute-api.ap-northeast-2.amazonaws.com/prod/data', // ?�크립트 ?�행 ???�동 ?�데?�트??
    RETRY_COUNT: 3,
    RETRY_DELAY: 1000
};

// API ?�출 ?�퍼 ?�수
async function callAPI(method, data = null) {
    const config = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (data) {
        config.body = JSON.stringify(data);
    }
    
    for (let i = 0; i < AWS_CONFIG.RETRY_COUNT; i++) {
        try {
            const response = await fetch(AWS_CONFIG.API_ENDPOINT, config);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`API ?�출 ?�패 (?�도 ${i + 1}/${AWS_CONFIG.RETRY_COUNT}):`, error);
            
            if (i === AWS_CONFIG.RETRY_COUNT - 1) {
                throw error;
            }
            
            // ?�시?????��?
            await new Promise(resolve => setTimeout(resolve, AWS_CONFIG.RETRY_DELAY));
        }
    }
}

// ?�라?�드?�서 ?�이??불러?�기
async function loadFromCloud() {
    try {
        console.log('?�라?�드?�서 ?�이??불러?�는 �?..');
        const data = await callAPI('GET');
        console.log('?�라?�드 ?�이??불러?�기 ?�공');
        return data;
    } catch (error) {
        console.error('?�라?�드 ?�이??불러?�기 ?�패:', error);
        
        // 로컬 ?�토리�? ?�백
        const localData = {
            members: JSON.parse(localStorage.getItem('runningClubMembers')) || [],
            records: JSON.parse(localStorage.getItem('runningClubRecords')) || [],
            schedules: JSON.parse(localStorage.getItem('runningClubSchedules')) || []
        };
        
        console.log('로컬 ?�토리�??�서 ?�이??불러??);
        return localData;
    }
}

// ?�라?�드???�이???�??
async function saveToCloud(members, records, schedules) {
    const data = {
        members: members,
        records: records,
        schedules: schedules
    };
    
    try {
        console.log('?�라?�드???�이???�??�?..');
        const result = await callAPI('POST', data);
        console.log('?�라?�드 ?�???�공:', result.message);
        
        // ?�공 ??로컬?�도 백업
        localStorage.setItem('runningClubMembers', JSON.stringify(members));
        localStorage.setItem('runningClubRecords', JSON.stringify(records));
        localStorage.setItem('runningClubSchedules', JSON.stringify(schedules));
        
        return true;
    } catch (error) {
        console.error('?�라?�드 ?�???�패:', error);
        
        // ?�패 ??로컬?�만 ?�??
        localStorage.setItem('runningClubMembers', JSON.stringify(members));
        localStorage.setItem('runningClubRecords', JSON.stringify(records));
        localStorage.setItem('runningClubSchedules', JSON.stringify(schedules));
        
        // ?�용?�에�??�림
        alert('?�터???�결???�인?�주?�요. ?�이?��? 로컬?�만 ?�?�되?�습?�다.');
        return false;
    }
}

// ?�결 ?�태 ?�인
async function checkCloudConnection() {
    try {
        await callAPI('GET');
        return true;
    } catch (error) {
        return false;
    }
}

// ?�이지 로드 ???�결 ?�태 ?�시
async function updateConnectionStatus() {
    const isConnected = await checkCloudConnection();
    const statusElement = document.getElementById('connectionStatus');
    
    if (statusElement) {
        if (isConnected) {
            statusElement.innerHTML = '?�� ?�라?�드 ?�결??;
            statusElement.className = 'connection-status online';
        } else {
            statusElement.innerHTML = '?�� ?�프?�인 모드';
            statusElement.className = 'connection-status offline';
        }
    }
}





