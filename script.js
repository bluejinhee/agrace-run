// 데이터 저장소
let members = [];
let records = [];
let schedules = [];

// 초기 데이터 로드
async function initializeData() {
    // TODO: Replace with Amplify Storage API calls
    // const data = await loadFromCloud();
    // Temporary fallback to empty data until Amplify Storage is implemented
    const data = {
        members: [],
        records: [],
        schedules: []
    };
    members = data.members || [];
    records = data.records || [];
    schedules = data.schedules || [];
}

// 마일스톤 설정 (km 단위) - 300km만 표시
const MILESTONES = [300];

// 달력 관련 변수
let currentDate = new Date();
const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async function() {
    // 로딩 표시
    showLoading(true);
    
    try {
        // 클라우드에서 데이터 로드
        await initializeData();
        
        // UI 업데이트
        updateMemberSelect();
        updateTeamProgress();
        updateStats();
        updateRecentRecords();
        updateCalendar();
        
        // TODO: Replace with Amplify connection status check
        // await updateConnectionStatus();
        
        // 날짜 입력 필드를 오늘 날짜로 초기화
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('recordDate').value = today;
        
    } catch (error) {
        console.error('초기화 오류:', error);
        alert('데이터 로드 중 오류가 발생했습니다. 페이지를 새로고침해주세요.');
    } finally {
        showLoading(false);
    }
});

// 로딩 표시 함수
function showLoading(show) {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = show ? 'block' : 'none';
    }
}



// 기록 추가
function addRecord() {
    const memberSelect = document.getElementById('memberSelect');
    const distanceInput = document.getElementById('distance');
    const paceInput = document.getElementById('pace');
    const dateInput = document.getElementById('recordDate');
    
    const memberId = parseInt(memberSelect.value);
    const distance = parseFloat(distanceInput.value);
    const pace = paceInput.value.trim();
    const selectedDate = dateInput.value;
    
    if (!memberId) {
        alert('멤버를 선택해주세요!');
        return;
    }
    
    if (!distance || distance <= 0) {
        alert('올바른 거리를 입력해주세요!');
        return;
    }
    
    if (!selectedDate) {
        alert('날짜를 선택해주세요!');
        return;
    }
    
    // 페이스 유효성 검사 (선택사항)
    if (pace && !isValidPace(pace)) {
        alert('페이스는 분:초 형식으로 입력해주세요 (예: 5:30)');
        return;
    }
    
    const member = members.find(m => m.id === memberId);
    const previousTotal = member.totalDistance;
    
    // 선택된 날짜를 한국어 형식으로 변환
    const recordDate = new Date(selectedDate);
    const formattedDate = recordDate.toLocaleDateString('ko-KR');
    const currentTime = new Date().toLocaleTimeString('ko-KR');
    
    // 기록 추가
    const newRecord = {
        id: Date.now(),
        memberId: memberId,
        distance: distance,
        pace: pace || null, // 페이스가 입력되지 않으면 null
        date: formattedDate,
        time: currentTime,
        originalDate: selectedDate // 정렬을 위한 원본 날짜 저장
    };
    
    records.push(newRecord);
    
    // 멤버 통계 업데이트
    member.totalDistance += distance;
    member.recordCount += 1;
    
    // 마일스톤 체크
    checkMilestone(member, previousTotal);
    
    saveData();
    updateTeamProgress();
    updateStats();
    updateRecentRecords();
    
    distanceInput.value = '';
    paceInput.value = '';
    // 날짜는 그대로 유지 (연속 입력 편의성)
    const paceText = pace ? ` (페이스: ${pace}/km)` : '';
    alert(`${member.name}님의 ${distance}km 기록이 ${formattedDate}로 추가되었습니다!${paceText} 🏃‍♂️`);
}

// 팀 마일스톤 체크 및 축하 메시지
function checkMilestone(member, previousTotal) {
    const previousTeamTotal = getTotalTeamDistance() - (member.totalDistance - previousTotal);
    const currentTeamTotal = getTotalTeamDistance();
    
    for (let milestone of MILESTONES) {
        if (previousTeamTotal < milestone && currentTeamTotal >= milestone) {
            showCelebration(milestone, currentTeamTotal);
            break;
        }
    }
}

// 축하 메시지 표시
function showCelebration(milestone, totalDistance) {
    const celebrationDiv = document.getElementById('celebration');
    const messageP = document.getElementById('celebrationMessage');
    
    messageP.textContent = `🎉 큰은혜교회 런닝크루가 함께 ${milestone}km를 달성했습니다! 회식 시간이에요! 🍽️🎊`;
    
    celebrationDiv.style.display = 'block';
    
    // 5초 후 자동으로 숨김
    setTimeout(() => {
        celebrationDiv.style.display = 'none';
    }, 5000);
}

// 멤버 선택 드롭다운 업데이트
function updateMemberSelect() {
    const select = document.getElementById('memberSelect');
    select.innerHTML = '<option value="">멤버를 선택하세요</option>';
    
    members.forEach(member => {
        const option = document.createElement('option');
        option.value = member.id;
        option.textContent = member.name;
        select.appendChild(option);
    });
}

// 전체 팀 거리 계산
function getTotalTeamDistance() {
    return members.reduce((total, member) => total + member.totalDistance, 0);
}

// 팀 목표 진행상황 업데이트
function updateTeamProgress() {
    const teamProgressDiv = document.getElementById('teamProgress');
    const totalDistance = getTotalTeamDistance();
    
    // 팀 전체 거리 표시
    const teamTotalHtml = `
        <div class="team-total">
            <h3>🏃‍♂️ 팀 전체 누적 거리 🏃‍♀️</h3>
            <div class="total-distance">${totalDistance.toFixed(1)} km</div>

        </div>
    `;
    
    // 각 목표별 진행상황
    const goalsHtml = MILESTONES.map(milestone => {
        const progress = Math.min((totalDistance / milestone) * 100, 100);
        const achieved = totalDistance >= milestone;
        
        return `
            <div class="goal-card ${achieved ? 'achieved' : ''}">
                <div class="goal-title">🍗 팀 목표 ${milestone}km 🍗</div>
                <div class="goal-progress">${progress.toFixed(1)}%</div>
                <div class="goal-target">${totalDistance.toFixed(1)} / ${milestone} km</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                ${achieved ? '<div style="margin-top: 10px;">🎉 치킨파티 달성! 🍗🎊</div>' : '<div style="margin-top: 10px;">🏃‍♂️ 치킨파티를 향해 달려요! 🏃‍♂️</div>'}
            </div>
        `;
    }).join('');
    
    teamProgressDiv.innerHTML = teamTotalHtml + '<div class="team-progress">' + goalsHtml + '</div>';
}

// 다음 팀 마일스톤 확인
function getNextTeamMilestone(totalDistance) {
    for (let milestone of MILESTONES) {
        if (totalDistance < milestone) {
            return milestone;
        }
    }
    return null;
}

// 개인 통계 업데이트
function updateStats() {
    const statsDiv = document.getElementById('memberStats');
    
    if (members.length === 0) {
        statsDiv.innerHTML = '<p style="text-align: center; color: #718096;">아직 등록된 멤버가 없습니다. 첫 번째 멤버가 되어보세요! 🏃‍♂️</p>';
        return;
    }
    
    // 총 거리순으로 정렬
    const sortedMembers = [...members].sort((a, b) => b.totalDistance - a.totalDistance);
    
    statsDiv.innerHTML = '';
    
    sortedMembers.forEach((member, index) => {
        const memberCard = document.createElement('div');
        memberCard.className = 'member-card';
        
        // 개인 기여도 계산
        const totalTeamDistance = getTotalTeamDistance();
        const contribution = totalTeamDistance > 0 ? ((member.totalDistance / totalTeamDistance) * 100).toFixed(1) : 0;
        
        memberCard.innerHTML = `
            <div class="member-name">
                ${index === 0 ? '🥇 ' : index === 1 ? '🥈 ' : index === 2 ? '🥉 ' : ''}${member.name}
            </div>
            <div class="member-stats">
                <div class="stat-item">
                    <div class="stat-value">${member.totalDistance.toFixed(1)}</div>
                    <div class="stat-label">개인 거리 (km)</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${member.recordCount}</div>
                    <div class="stat-label">출석 횟수</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${contribution}%</div>
                    <div class="stat-label">팀 기여도</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${member.joinDate}</div>
                    <div class="stat-label">가입일</div>
                </div>
            </div>
        `;
        
        statsDiv.appendChild(memberCard);
    });
}



// 최근 기록 업데이트
function updateRecentRecords() {
    const recordsDiv = document.getElementById('recentRecords');
    
    if (records.length === 0) {
        recordsDiv.innerHTML = '<div class="no-records">아직 기록이 없습니다. 첫 번째 기록을 추가해보세요! 🏃‍♂️</div>';
        return;
    }
    
    // 날짜순으로 정렬 (최신 날짜부터, 최신 10개만)
    const recentRecords = [...records]
        .sort((a, b) => {
            // originalDate가 있으면 그것을 사용, 없으면 id로 정렬
            if (a.originalDate && b.originalDate) {
                return new Date(b.originalDate) - new Date(a.originalDate);
            }
            return b.id - a.id;
        })
        .slice(0, 10);
    
    recordsDiv.innerHTML = '';
    
    recentRecords.forEach(record => {
        const member = members.find(m => m.id === record.memberId);
        if (!member) return;
        
        const recordItem = document.createElement('div');
        recordItem.className = 'record-item';
        
        recordItem.innerHTML = `
            <div class="record-info">
                <div class="record-member">${member.name}</div>
                <div class="record-distance">${record.distance}km</div>
                ${record.pace ? `<div class="record-pace">${record.pace}/km</div>` : ''}
            </div>
            <div class="record-date">${record.date} ${record.time}</div>
        `;
        
        recordsDiv.appendChild(recordItem);
    });
}

// 달력 업데이트
function updateCalendar() {
    const calendar = document.getElementById('calendar');
    const currentMonthElement = document.getElementById('currentMonth');
    
    // 현재 월 표시
    currentMonthElement.textContent = `${currentDate.getFullYear()}년 ${monthNames[currentDate.getMonth()]}`;
    
    // 달력 초기화
    calendar.innerHTML = '';
    
    // 요일 헤더 추가
    dayNames.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        calendar.appendChild(dayHeader);
    });
    
    // 이번 달의 첫 날과 마지막 날
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // 이전 달의 마지막 날들
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // 6주 표시 (42일)
    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        // 다른 달인지 확인
        if (date.getMonth() !== currentDate.getMonth()) {
            dayElement.classList.add('other-month');
        }
        
        // 오늘인지 확인
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }
        
        // 스케줄이 있는지 확인
        const dateString = date.toISOString().split('T')[0];
        const daySchedules = schedules.filter(schedule => schedule.date === dateString);
        
        if (daySchedules.length > 0) {
            dayElement.classList.add('has-schedule');
        }
        
        // 날짜 번호
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = date.getDate();
        dayElement.appendChild(dayNumber);
        
        // 스케줄 표시
        daySchedules.slice(0, 2).forEach(schedule => {
            const scheduleIndicator = document.createElement('div');
            scheduleIndicator.className = 'schedule-indicator';
            scheduleIndicator.textContent = `${schedule.time} ${schedule.location}`;
            dayElement.appendChild(scheduleIndicator);
        });
        
        if (daySchedules.length > 2) {
            const moreIndicator = document.createElement('div');
            moreIndicator.className = 'schedule-indicator';
            moreIndicator.textContent = `+${daySchedules.length - 2}개`;
            dayElement.appendChild(moreIndicator);
        }
        
        calendar.appendChild(dayElement);
    }
}

// 이전 달로 이동
function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    updateCalendar();
}

// 다음 달로 이동
function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    updateCalendar();
}

// 페이스 유효성 검사 함수
function isValidPace(pace) {
    const pacePattern = /^[0-9]+:[0-5][0-9]$/;
    return pacePattern.test(pace);
}

// 데이터 저장
async function saveData() {
    // TODO: Replace with Amplify Storage API calls
    // await saveToCloud(members, records, schedules);
    console.log('Data save temporarily disabled - will be replaced with Amplify Storage API');
}