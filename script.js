// 데이터 저장소
let members = JSON.parse(localStorage.getItem('runningClubMembers')) || [];
let records = JSON.parse(localStorage.getItem('runningClubRecords')) || [];

// 마일스톤 설정 (km 단위) - 300km만 표시
const MILESTONES = [300];

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    updateMemberSelect();
    updateTeamProgress();
    updateStats();
    updateRecentRecords();
    
    // 날짜 입력 필드를 오늘 날짜로 초기화
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('recordDate').value = today;
});



// 기록 추가
function addRecord() {
    const memberSelect = document.getElementById('memberSelect');
    const distanceInput = document.getElementById('distance');
    const dateInput = document.getElementById('recordDate');
    
    const memberId = parseInt(memberSelect.value);
    const distance = parseFloat(distanceInput.value);
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
    // 날짜는 그대로 유지 (연속 입력 편의성)
    alert(`${member.name}님의 ${distance}km 기록이 ${formattedDate}로 추가되었습니다! 🏃‍♂️`);
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
            <div class="next-goal">
                ${getNextTeamMilestone(totalDistance) ? 
                    `다음 목표까지 ${(getNextTeamMilestone(totalDistance) - totalDistance).toFixed(1)}km 남았어요!` : 
                    '모든 목표를 달성했습니다! 🎉'}
            </div>
        </div>
    `;
    
    // 각 목표별 진행상황
    const goalsHtml = MILESTONES.map(milestone => {
        const progress = Math.min((totalDistance / milestone) * 100, 100);
        const achieved = totalDistance >= milestone;
        
        return `
            <div class="goal-card ${achieved ? 'achieved' : ''}">
                <div class="goal-title">${milestone}km 목표</div>
                <div class="goal-progress">${progress.toFixed(1)}%</div>
                <div class="goal-target">${totalDistance.toFixed(1)} / ${milestone} km</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                ${achieved ? '<div style="margin-top: 10px;">🎉 달성 완료! 🎉</div>' : ''}
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
                ${index === 0 ? '👑 ' : ''}${member.name}
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
            </div>
            <div class="record-date">${record.date} ${record.time}</div>
        `;
        
        recordsDiv.appendChild(recordItem);
    });
}

// 데이터 저장
function saveData() {
    localStorage.setItem('runningClubMembers', JSON.stringify(members));
    localStorage.setItem('runningClubRecords', JSON.stringify(records));
}