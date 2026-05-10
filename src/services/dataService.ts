/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Papa from 'papaparse';

export interface RawExamData {
  ID: string;
  'Tên đề thi': string;
  'Năm học': string;
  'Địa phương': string;
  'Mức độ': string;
  'Link đề': string;
  'Đáp án'?: string;
}

export interface Exam {
  id: string;
  title: string;
  year: string;
  province: string;
  difficulty: string;
  pdfUrl: string;
  answerUrl: string;
  updatedAt: string; // We'll derive this or use a default
}

// Link CSV từ Google Sheets (Publish to web -> CSV)
const GOOGLE_SHEET_CSV_URL = ''; 

const CSV_CONTENT = `ID,Tên đề thi,Năm học,Địa phương,Mức độ,Link đề,Đáp án
DE001,Đề thi HSG tỉnh Nam Định - bảng A,2024-2025,Nam Định,Giỏi,https://drive.google.com/file/d/1XbvGgYQ344n-TUQS00ZYnr0_UqPkgRlP/view?usp=sharing,https://drive.google.com/file/d/1WxMoOjEiLPXEnV2GORxuE1TobEkozz8_/view?usp=sharing
DE002,Đề thi HSG tỉnh Nam Định - bảng B,2024-2025,Nam Định,Giỏi,https://drive.google.com/file/d/1216iVycPyO_gKlSxOufAZjuqrmZqMFQM/view?usp=sharing,https://drive.google.com/file/d/1sNw6-NIOkdYXXRY0oHuCfNkQL0802vaY/view?usp=sharing
DE003,Đề thi HSG tỉnh Thừa Thiên Huế,2022-2023,Thừa Thiên Huế,Khá,https://drive.google.com/file/d/1fhHWZ0gaCzSd5o8tnXR4YU07KYqjd95V/view?usp=sharing,
DE004,Đề thi HSG tỉnh Tuyên Quang,2025-2026,Tuyên Quang,Giỏi,https://drive.google.com/file/d/1yYA30WMuB-a632URv0y9ZAeaRS1E6Dmj/view?usp=sharing,
`;

export interface Topic {
  id: string;
  title: string;
  pdfUrl: string;
}

export interface QuizItem {
  id: string;
  lesson: string;
  material: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
}

export interface RawTopicData {
  ID: string;
  'Tên chuyên đề': string;
  'Link tài liệu': string;
}

export interface RawQuizData {
  ID: string;
  Bài: string;
  'Tư liệu': string;
  'Câu hỏi': string;
  'Đáp án A': string;
  'Đáp án B': string;
  'Đáp án C': string;
  'Đáp án D': string;
  'Đáp án đúng': string;
}

// Link CSV từ Google Sheets (nếu có)
const GOOGLE_SHEET_TOPICS_CSV_URL = '';
const GOOGLE_SHEET_QUIZ_CSV_URL = '';

const TOPICS_CSV_CONTENT = `ID,Tên chuyên đề,Link tài liệu
CD001,CHỦ ĐỀ 1: THẾ GIỚI TỪ NĂM 1918 ĐẾN NĂM 1945,https://drive.google.com/file/d/1ppuoMXF0lZHtyQXO8FIlulIWcp_pu1K3/view?usp=sharing
CD002,"CHỦ ĐỀ 2: VIỆT NAM TỪ NĂM 1918 ĐẾN NĂM 1945 (MỤC TIÊU 2018)",https://drive.google.com/file/d/10IcCjR5WC3a5KQGMAv-ibotMXTj9UWpn/view?usp=sharing
CD003,CHỦ ĐỀ 3: THẾ GIỚI TỪ NĂM 1945 ĐẾN NĂM 1991,https://drive.google.com/file/d/1DKGGIytDXkhNjYYAkWfzX-5CEVpYrf93/view?usp=sharing
CD004,CHỦ ĐỀ 4: VIỆT NAM TỪ NĂM 1945 ĐẾN NĂM 1991,https://drive.google.com/file/d/11HBqoq048ijrm0X72WF46zVrA8jAcbWb/view?usp=sharing
`;

const QUIZ_CSV_CONTENT = `ID,Bài,Tư liệu,Câu hỏi,Đáp án A,Đáp án B,Đáp án C,Đáp án D,Đáp án đúng
L1_01,BÀI 1: NƯỚC NGA VÀ LIÊN XÔ (1918 - 1945),,"[Chính quyền Xô viết ban hành sắc lệnh hoà bình, rút Nga ra khỏi Chiến tranh thế giới thứ nhất. Đồng thời, chính quyền mới quốc hữu hóa ruộng đất, giao đất cho nông dân cày cấy.] Việc rút Nga ra khỏi Chiến tranh thế giới thứ nhất có ý nghĩa chủ yếu gì?",Giúp Nga ký hiệp ước hoà bình với các nước đế quốc,Bảo đảm đất nước có điều kiện tập trung giải quyết nội chiến và xây dựng chính quyền Xô viết,Thể hiện Nga sẵn sàng từ bỏ mọi lợi ích trong chiến tranh,Làm tăng sức mạnh quân sự của phe Hiệp ước,B
L1_02,BÀI 1: NƯỚC NGA VÀ LIÊN XÔ (1918 - 1945),,"[Năm 1918–1921, nhân dân Liên Xô đã trải qua những năm tháng cực kỳ khó khăn khi phải tiến hành nội chiến chống các thế lực phản động trong nước và sự can thiệp của 14 nước đế quốc.] Nội chiến Nga (1918–1921) phản ánh đặc điểm nào nổi bật nhất của tình hình nước Nga sau Cách mạng Tháng Mười?",Nước Nga vẫn duy trì nền kinh tế tư bản chủ nghĩa,Nước Nga bị cô lập về ngoại giao nhưng ổn định trong nước,Chính quyền Xô viết non trẻ phải đối mặt with thù trong giặc ngoài,Đế quốc phương Tây ủng hộ phong trào cách mạng Nga,C
L1_03,BÀI 1: NƯỚC NGA VÀ LIÊN XÔ (1918 - 1945),,"[Sau khi nội chiến kết thúc, nền kinh tế quốc dân bị tàn phá nặng nề. Sản lượng công nghiệp năm 1921 chỉ còn khoảng 1/7 so với năm 1913.] Nguyên nhân nào dẫn đến tình trạng nền kinh tế Liên Xô suy sụp sau nội chiến?",Nước Nga tập trung mọi nguồn lực cho phát triển công nghiệp nhẹ,"Chính sách cộng sản thời chiến chỉ chú trọng quân sự, không quan tâm kinh tế",Sự cấm vận kinh tế của Mỹ và phương Tây,Do thiên tai kéo dài nhiều năm,B
L1_04,BÀI 1: NƯỚC NGA VÀ LIÊN XÔ (1918 - 1945),"Chính sách kinh tế mới (NEP) được thực hiện từ năm 1921, cho phép tư nhân kinh doanh nhỏ, khuyến khích sản xuất hàng hóa và khôi phục nền kinh tế.",NEP phản ánh sự thay đổi nào trong chính sách kinh tế của Liên Xô?,Chuyển từ cơ chế kế hoạch hóa sang cơ chế thị trường,Từ bỏ hoàn toàn công hữu và trở về tư bản,Tạm thời nhượng bộ kinh tế tư nhân để phục hồi sản xuất,"Đóng cửa kinh tế, hạn chế buôn bán",C
L1_05,BÀI 1: NƯỚC NGA VÀ LIÊN XÔ (1918 - 1945),"Trong những năm 1925–1941, Liên Xô thực hiện ba kế hoạch 5 năm, tập trung phát triển công nghiệp nặng và điện khí hóa toàn quốc.",Mục tiêu chủ yếu của các kế hoạch 5 năm là gì?,Biến Liên Xô thành một nước công nghiệp hiện đại,Tăng cường xuất khẩu nông sản để tích lũy vốn,Phát triển dịch vụ và thương mại đối ngoại,Tập trung công nghiệp nhẹ và tiêu dùng,A
L1_06,BÀI 1: NƯỚC NGA VÀ LIÊN XÔ (1918 - 1945),"Chỉ trong vòng hơn 10 năm, Liên Xô từ một nước nông nghiệp lạc hậu trở thành cường quốc công nghiệp đứng thứ hai thế giới (sau Mỹ).",Điều này chứng tỏ chính sách kinh tế nào đã phát huy hiệu quả mạnh mẽ?,Chính sách cộng sản thời chiến,Chính sách kinh tế mới (NEP),Các kế hoạch 5 năm xây dựng CNXH,Chính sách đối ngoại hòa bình,C
L1_07,BÀI 1: NƯỚC NGA VÀ LIÊN XÔ (1918 - 1945),"Chiến tranh Vệ quốc vĩ đại (1941–1945) là cuộc đấu tranh của nhân dân Liên Xô chống phát xít Đức xâm lược, diễn ra với sự tham gia toàn dân và đã kết thúc thắng lợi.",Nguyên nhân trực tiếp dẫn đến cuộc Chiến tranh Vệ quốc là gì?,Đức phát xít tấn công Liên Xô bằng chiến dịch Barbarossa,Liên Xô tấn công Ba Lan,Nhật Bản xâm lược vùng Viễn Đông,Mỹ phát động chiến tranh kinh tế chống Liên Xô,A
L1_08,BÀI 1: NƯỚC NGA VÀ LIÊN XÔ (1918 - 1945),"Trong chiến tranh, Liên Xô phải di chuyển nhiều cơ sở công nghiệp về phía đông, phát động toàn dân kháng chiến, sản xuất vũ khí và lương thực.",Chi tiết này phản ánh điều gì về chiến tranh của Liên Xô?,Cuộc chiến tranh diễn ra chủ yếu ở Viễn Đông,"Tinh thần tự lực, sáng tạo và kiên cường của nhân dân Liên Xô","Liên Xô chỉ dựa vào viện trợ từ Anh, Mỹ",Liên Xô không chịu thiệt hại nào trong chiến tranh,B
L1_09,BÀI 1: NƯỚC NGA VÀ LIÊN XÔ (1918 - 1945),Chiến thắng Stalingrad (2/1943) đã đập tan huyền thoại ‘bất bại’ của phát xít Đức và làm thay đổi cục diện chiến tranh thế giới.,Ý nghĩa lớn nhất của chiến thắng Stalingrad là gì?,Kết thúc Chiến tranh thế giới thứ hai ở châu Âu,Buộc Nhật Bản đầu hàng,"Tạo bước ngoặt chiến lược, chuyển sang phản công phe phát xít",Chấm dứt sự tồn tại của phát xít Ý,C
L1_10,BÀI 1: NƯỚC NGA VÀ LIÊN XÔ (1918 - 1945),"Trong Chiến tranh thế giới thứ hai, Liên Xô đã tiêu diệt hơn 600 sư đoàn Đức, góp phần quyết định đánh bại chủ nghĩa phát xít.",Nhận định nào đúng nhất về vai trò của Liên Xô trong chiến tranh?,Liên Xô chỉ đóng vai trò thứ yếu ở mặt trận châu Âu,Liên Xô là lực lượng chủ yếu đánh bại phát xít Đức,Liên Xô tham chiến nhưng không chịu thiệt hại,Liên Xô chiến thắng nhờ Anh – Mỹ,B
L1_11,BÀI 1: NƯỚC NGA VÀ LIÊN XÔ (1918 - 1945),"Chiến tranh vệ quốc vĩ đại đã để lại hậu quả nặng nề: hơn 27 triệu người chết, nhiều thành phố, làng mạc bị phá hủy.",Hậu quả nặng nề này phản ánh điều gì?,Liên Xô không chuẩn bị quốc phòng,"Chiến tranh vệ quốc là cuộc chiến tàn khốc, toàn diện",Nhân dân Liên Xô không đoàn kết,Chiến tranh chỉ diễn ra ở mặt trận biển,B
L1_12,BÀI 1: NƯỚC NGA VÀ LIÊN XÔ (1918 - 1945),"Ngày 9/5/1945, quân đội Liên Xô treo cờ chiến thắng trên tòa nhà Quốc hội Đức ở Béc-lin.",Sự kiện này đánh dấu:,Chiến tranh Thái Bình Dương kết thúc,"Phát xít Đức đầu hàng vô điều kiện, chiến tranh ở châu Âu kết thúc",Liên Xô tấn công Nhật Bản,Mỹ tuyên bố tham chiến ở châu Âu,B
L1_13,BÀI 1: NƯỚC NGA VÀ LIÊN XÔ (1918 - 1945),"Chiến thắng trong Chiến tranh vệ quốc đã nâng cao uy tín quốc tế của Liên Xô, biến Liên Xô thành một cường quốc lớn trên thế giới.",Điều này dẫn tới hệ quả nào sau đây?,Liên Xô suy yếu và phụ thuộc kinh tế Mỹ,Liên Xô giữ vai trò quan trọng trong việc thành lập Liên hợp quốc,Liên Xô không còn ảnh hưởng chính trị,Liên Xô rút khỏi các vấn đề quốc tế,B
L1_14,BÀI 1: NƯỚC NGA VÀ LIÊN XÔ (1918 - 1945),"Trong giai đoạn 1918–1945, Liên Xô vừa phải đối mặt với nội chiến, vừa phải xây dựng công nghiệp, vừa tham gia Chiến tranh thế giới thứ hai và giành thắng lợi.",Nhận định đúng nhất về Liên Xô giai đoạn này là:,Liên Xô trì trệ về kinh tế và không phát triển,Liên Xô đạt nhiều thành tựu to lớn dù trong hoàn cảnh vô cùng khó khăn,"Liên Xô chỉ phát triển nông nghiệp, không công nghiệp hóa",Liên Xô không có vai trò quốc tế,B
L1_15,BÀI 1: NƯỚC NGA VÀ LIÊN XÔ (1918 - 1945),"Chiến tranh đã thúc đẩy tình đoàn kết dân tộc và sự hy sinh to lớn của toàn thể nhân dân Liên Xô, từ công nhân, nông dân đến trí thức, phụ nữ và trẻ em.",Đặc điểm nào của chiến tranh được thể hiện rõ qua tư liệu trên?,Chiến tranh giới hạn ở một số địa phương,"Chiến tranh toàn dân, toàn diện",Chiến tranh chỉ do quân đội tiến hành,Chiến tranh diễn ra chủ yếu ở Mỹ và Anh,B
L2_01,BÀI 2: CHÂU ÂU VÀ NƯỚC MỸ (1918 - 1945),"Cuộc khủng hoảng kinh tế 1929 – 1933 bắt đầu ở Mỹ, nhanh chóng lan rộng ra toàn thế giới tư bản chủ nghĩa. Hàng nghìn ngân hàng đóng cửa, hàng triệu người thất nghiệp, sản xuất công nghiệp giảm mạnh...","Nguyên nhân trực tiếp dẫn đến tình trạng “hàng nghìn ngân hàng đóng cửa, hàng triệu người thất nghiệp” ở Mỹ là:",Hệ thống ngân hàng Mỹ thiếu sự quản lý của Nhà nước,Chính sách kinh tế tự do tư bản chủ nghĩa bộc lộ hạn chế,Nền kinh tế Mỹ suy sụp sau Chiến tranh thế giới thứ hai,Mỹ bị khủng hoảng do ảnh hưởng của phong trào cách mạng thế giới,B
L2_02,BÀI 2: CHÂU ÂU VÀ NƯỚC MỸ (1918 - 1945),"Năm 1933, Hít-le lên nắm chính quyền ở Đức và thiết lập chế độ độc tài phát xít. Đảng Quốc xã thực hiện chính sách đàn áp tàn bạo, chuẩn bị chiến tranh nhằm chia lại thế giới.",Hành động nào của chính quyền Hít-le thể hiện rõ nhất âm mưu gây chiến tranh thế giới mới?,Tăng cường sản xuất hàng tiêu dùng phục vụ dân sinh,Ban hành luật bảo vệ quyền lợi của người lao động,Đẩy mạnh sản xuất vũ khí và tuyên truyền chủ nghĩa phát xít,Kêu gọi giải trừ quân bị toàn cầu,C
L2_03,BÀI 2: CHÂU ÂU VÀ NƯỚC MỸ (1918 - 1945),"Sau chiến tranh thế giới thứ nhất, nước Mỹ trở thành trung tâm kinh tế, tài chính lớn nhất thế giới. Sản lượng công nghiệp của Mỹ chiếm tới hơn 40% tổng sản lượng công nghiệp toàn cầu.",Nguyên nhân chính khiến Mỹ vươn lên vị trí đứng đầu về kinh tế sau Chiến tranh thế giới thứ nhất là:,"Mỹ tham gia chiến tranh ngay từ đầu, chiếm nhiều thuộc địa","Mỹ ít bị chiến tranh tàn phá, thu nhiều lợi nhuận từ xuất khẩu",Mỹ không chịu ảnh hưởng của khủng hoảng kinh tế,Mỹ tập trung phát triển nông nghiệp và khai khoáng,B
L2_04,BÀI 2: CHÂU ÂU VÀ NƯỚC MỸ (1918 - 1945),"Khủng hoảng kinh tế 1929 – 1933 gây ra hậu quả nặng nề chưa từng có: sản xuất công nghiệp giảm một nửa, thương mại thế giới suy sụp, mâu thuẫn xã hội gay gắt, phong trào đấu tranh của công nhân lan rộng.",Hậu quả nào sau đây KHÔNG phải do khủng hoảng kinh tế 1929–1933 gây ra?,Thương mại thế giới suy sụp nghiêm trọng,Phong trào đấu tranh cách mạng ở nhiều nước phát triển mạnh,Chủ nghĩa phát xít xuất hiện và thắng thế ở một số nước,Chủ nghĩa xã hội được thiết lập trên toàn châu Âu,D
L2_05,BÀI 2: CHÂU ÂU VÀ NƯỚC MỸ (1918 - 1945),"Ngày 1/9/1939, quân Đức tấn công Ba Lan. Hai ngày sau, Anh và Pháp tuyên chiến với Đức, Chiến tranh thế giới thứ hai bùng nổ.",Sự kiện đánh dấu Chiến tranh thế giới thứ hai chính thức bùng nổ là:,Đức chiếm đóng Pháp,Nhật Bản tấn công Trân Châu Cảng,Đức tấn công Liên Xô,Đức tấn công Ba Lan,D
L2_06,BÀI 2: CHÂU ÂU VÀ NƯỚC MỸ (1918 - 1945),"Đầu thập niên 30, tình hình kinh tế, chính trị nước Đức khủng hoảng nghiêm trọng. Sự bất mãn trong xã hội tạo điều kiện cho Đảng Quốc xã và Hít-le lên cầm quyền.",Yếu tố nào tạo điều kiện quan trọng nhất để Hít-le lên nắm chính quyền?,"Đức được sự giúp đỡ quân sự từ Anh, Pháp",Nước Đức có tiềm lực công nghiệp mạnh,"Đức rơi vào khủng hoảng toàn diện, xã hội bất mãn",Đảng Quốc xã chủ trương xây dựng dân chủ,C
L2_07,BÀI 2: CHÂU ÂU VÀ NƯỚC MỸ (1918 - 1945),"Khủng hoảng kinh tế khiến nhiều nước tư bản rơi vào bế tắc. Một số nước như Đức, Ý, Nhật đi theo con đường phát xít hóa để thoát khỏi khủng hoảng.","Nguyên nhân trực tiếp dẫn đến sự ra đời của chủ nghĩa phát xít ở Đức, Ý, Nhật là:",Tình trạng kinh tế khủng hoảng và mâu thuẫn xã hội gay gắt,Các nước này muốn xây dựng chủ nghĩa cộng sản,Mâu thuẫn giữa các nước phát xít và thuộc địa,Sự sụp đổ hoàn toàn của Liên Xô,A
L2_08,BÀI 2: CHÂU ÂU VÀ NƯỚC MỸ (1918 - 1945),"Năm 1932, trong bối cảnh khủng hoảng, Tổng thống Mĩ Ru-dơ-ven đề ra Chính sách Kinh tế mới (New Deal), nhằm cứu vãn nền kinh tế tư bản chủ nghĩa thông qua sự can thiệp của Nhà nước.",Chính sách New Deal của Mỹ có điểm nổi bật là:,"Đẩy mạnh chạy đua vũ trang, chuẩn bị chiến tranh",Nhà nước tăng cường vai trò điều tiết kinh tế,Thực hiện chính sách biệt lập với thế giới,Phát triển mạnh công nghiệp quân sự,B
L2_09,BÀI 2: CHÂU ÂU VÀ NƯỚC MỸ (1918 - 1945),"Từ năm 1939 đến năm 1941, chiến tranh thế giới thứ hai diễn ra chủ yếu ở châu Âu. Quân Đức dùng chiến lược ‘đánh chớp nhoáng’, nhanh chóng chiếm phần lớn lục địa châu Âu.",Chiến lược quân sự “đánh chớp nhoáng” của Đức nhằm mục đích:,Kéo dài thời gian chiến tranh để củng cố lực lượng,"Tập trung lực lượng, đánh nhanh, thắng nhanh",Tạo điều kiện để đồng minh phát triển công nghiệp,Tránh đối đầu trực tiếp với Liên Xô,B
L2_10,BÀI 2: CHÂU ÂU VÀ NƯỚC MỸ (1918 - 1945),"Ngày 7/12/1941, Nhật Bản tấn công Trân Châu Cảng, buộc Mỹ tuyên chiến với Nhật. Chiến tranh lan rộng khắp thế giới.",Hệ quả trực tiếp của sự kiện Nhật tấn công Trân Châu Cảng là:,Chiến tranh thế giới thứ hai lan rộng ra toàn cầu,Mỹ rút khỏi chiến tranh,"Đức, Ý chấm dứt liên minh với Nhật",Nhật chiếm toàn bộ châu Âu,A
L2_11,BÀI 2: CHÂU ÂU VÀ NƯỚC MỸ (1918 - 1945),"Đầu năm 1943, Hồng quân Liên Xô giành thắng lợi vang dội ở Xta-lin-grát, tạo bước ngoặt quyết định trong chiến tranh thế giới thứ hai.",Chiến thắng Xta-lin-grát có ý nghĩa quan trọng nhất là:,Liên Xô trở thành đồng minh của Nhật,Làm phá sản chiến lược “đánh chớp nhoáng” của Đức,Khiến Mỹ rút quân khỏi châu Âu,Nhật phải đầu hàng vô điều kiện,B
L2_12,BÀI 2: CHÂU ÂU VÀ NƯỚC MỸ (1918 - 1945),"Tháng 6/1944, quân Đồng minh mở mặt trận thứ hai ở Tây Âu, đổ bộ vào miền Bắc nước Pháp, giải phóng Pa-ri và tiến vào nước Đức.",Việc mở mặt trận thứ hai của Đồng minh ở Tây Âu năm 1944 nhằm:,Tạo điều kiện cho quân Nhật rút lui về châu Á,Chia sẻ gánh nặng với Liên Xô trên mặt trận phía Đông,Đánh chiếm Liên Xô để chia lại lãnh thổ,Chuẩn bị đối phó với phong trào giải phóng dân tộc,B
L2_13,BÀI 2: CHÂU ÂU VÀ NƯỚC MỸ (1918 - 1945),"Ngày 8/5/1945, Đức kí văn kiện đầu hàng vô điều kiện, Chiến tranh thế giới thứ hai kết thúc ở châu Âu.",Sự kiện đánh dấu kết thúc chiến tranh thế giới thứ hai ở châu Âu là:,Đức kí kết Hiệp định Véc-xai,Đức kí văn kiện đầu hàng vô điều kiện,Liên Xô tấn công Nhật Bản,Mỹ ném bom nguyên tử xuống Nhật,B
L2_14,BÀI 2: CHÂU ÂU VÀ NƯỚC MỸ (1918 - 1945),"Ngày 6 và 9/8/1945, Mỹ ném hai quả bom nguyên tử xuống thành phố Hi-rô-si-ma và Na-ga-xa-ki của Nhật. Ngày 15/8/1945, Nhật đầu hàng vô điều kiện.",Nguyên nhân chính buộc Nhật Bản phải đầu hàng vô điều kiện là:,Quân Đồng minh giải phóng Pa-ri,Nhật thiếu nguyên liệu sản xuất vũ khí,Sự kiện Mỹ ném bom nguyên tử và Liên Xô tuyên chiến với Nhật,Phong trào giải phóng dân tộc ở Đông Nam Á phát triển,C
L2_15,BÀI 2: CHÂU ÂU VÀ NƯỚC MỸ (1918 - 1945),"Chiến tranh thế giới thứ hai là cuộc chiến tranh tàn khốc nhất trong lịch sử loài người, làm hơn 70 triệu người chết, nhiều thành phố, làng mạc bị phá hủy hoàn toàn.",Điều gì khiến Chiến tranh thế giới thứ hai trở thành cuộc chiến tranh tàn khốc nhất lịch sử?,"Sự tham gia của nhiều quốc gia, phạm vi chiến tranh toàn cầu","Việc sử dụng vũ khí hạt nhân, thiệt hại nhân mạng và kinh tế khủng khiếp",Chủ nghĩa phát xít bành trướng khắp thế giới,Sự ra đời của nhiều liên minh quân sự,B
L3_01,BÀI 3: CHÂU Á (1918 - 1945),"Sau Chiến tranh thế giới thứ nhất, phong trào đấu tranh chống đế quốc ở nhiều nước châu Á bùng nổ mạnh mẽ, tiêu biểu là phong trào Ngũ Tứ (1919) ở Trung Quốc, phong trào cách mạng 1923 ở In-đô-nê-xi-a, phong trào đấu tranh giành độc lập của nhân dân Ấn Độ…",Phong trào Ngũ Tứ ở Trung Quốc năm 1919 bùng nổ chủ yếu do nguyên nhân nào?,Chính quyền Tôn Trung Sơn phát động phong trào dân chủ.,Trung Quốc thắng lợi sau Chiến tranh thế giới thứ nhất.,"Các nước đế quốc chia nhau quyền lợi, xâm phạm chủ quyền Trung Quốc.",Sự ủng hộ mạnh mẽ của Liên Xô.,C
L3_02,BÀI 3: CHÂU Á (1918 - 1945),"Năm 1930, Đảng Cộng sản Đông Dương ra đời, đánh dấu bước ngoặt trong phong trào cách mạng Việt Nam, đưa cách mạng Việt Nam trở thành một bộ phận của phong trào cách mạng thế giới.",Sự kiện nào đánh dấu phong trào cách mạng Việt Nam bước sang một thời kỳ mới?,Khởi nghĩa Yên Thế bùng nổ.,Đảng Cộng sản Đông Dương ra đời.,Phong trào Ngũ Tứ nổ ra.,Cách mạng Tháng Mười Nga thành công.,B
L3_03,BÀI 3: CHÂU Á (1918 - 1945),"Sau Chiến tranh thế giới thứ nhất, Ấn Độ vẫn là thuộc địa quan trọng của Anh. Phong trào đấu tranh giành độc lập của nhân dân Ấn Độ ngày càng phát triển mạnh mẽ, tiêu biểu với phong trào bất hợp tác 1920 – 1922 do M. Gandhi lãnh đạo.",Đặc điểm nổi bật của phong trào đấu tranh ở Ấn Độ giai đoạn 1920–1922 là gì?,Khởi nghĩa vũ trang đồng loạt.,Bất hợp tác và đấu tranh chính trị ôn hòa.,Tập trung đấu tranh trong giới quý tộc.,Hạn chế hoạt động ngoại giao.,B
L3_04,BÀI 3: CHÂU Á (1918 - 1945),"Từ năm 1937, Nhật Bản mở rộng chiến tranh xâm lược Trung Quốc, gây ra nhiều cuộc thảm sát, tàn sát dân thường nghiêm trọng, tiêu biểu là sự kiện Nam Kinh.",Hành động mở rộng chiến tranh của Nhật Bản ở Trung Quốc năm 1937 nhằm mục đích chính gì?,Ngăn chặn phong trào cộng sản.,Thực hiện chiến lược bá chủ toàn cầu.,Giúp Trung Quốc chống thực dân phương Tây.,Xây dựng liên minh chống Liên Xô.,B
L3_05,BÀI 3: CHÂU Á (1918 - 1945),"Phong trào cách mạng ở các nước Đông Nam Á phát triển mạnh từ sau Chiến tranh thế giới thứ nhất. Tiêu biểu là sự ra đời của Đảng Cộng sản In-đô-nê-xi-a (1920), phong trào dân tộc ở Xiêm, Mianma, và nhiều nước trong khu vực.",Nguyên nhân chung thúc đẩy phong trào cách mạng Đông Nam Á sau Chiến tranh thế giới thứ nhất là gì?,"Sự áp bức, bóc lột nặng nề của thực dân phương Tây.",Xuất hiện các đế quốc mới ở khu vực.,Các nước Đông Nam Á đã giành độc lập hoàn toàn.,Ảnh hưởng của chính sách trung lập của Mỹ.,A
L3_06,BÀI 3: CHÂU Á (1918 - 1945),"Tháng 3/1921, chính quyền Xô viết ban hành Chính sách kinh tế mới (NEP), nhanh chóng khôi phục nền kinh tế Liên Xô, tạo điều kiện để Liên Xô trở thành chỗ dựa cho phong trào cách mạng thế giới.",Chính sách NEP của Liên Xô tác động thế nào đến phong trào cách mạng châu Á?,Làm phong trào suy yếu do mâu thuẫn nội bộ.,"Trở thành nguồn cổ vũ tinh thần, hỗ trợ cách mạng.",Thúc đẩy tư tưởng bạo động cực đoan.,Khiến các nước châu Á phụ thuộc kinh tế vào Liên Xô.,B
L3_07,BÀI 3: CHÂU Á (1918 - 1945),"Tháng 8/1945, nhân dân Việt Nam dưới sự lãnh đạo của Đảng Cộng sản Đông Dương đã vùng lên giành chính quyền trong cả nước, lập nên nước Việt Nam Dân chủ Cộng hòa.",Cuộc Cách mạng tháng Tám năm 1945 ở Việt Nam có ý nghĩa gì đối với phong trào giải phóng dân tộc ở châu Á?,Chấm dứt hoàn toàn chế độ phong kiến ở châu Á.,Cổ vũ mạnh mẽ các dân tộc thuộc địa đứng lên giành độc lập.,Là nguyên nhân trực tiếp dẫn đến Chiến tranh thế giới thứ hai.,Khẳng định vai trò lãnh đạo của Liên Xô tại châu Á.,B
L3_08,BÀI 3: CHÂU Á (1918 - 1945),"Đến đầu thế kỉ XX, Nhật Bản trở thành cường quốc đế quốc chủ nghĩa, thực hiện chính sách xâm lược ở châu Á, đặc biệt là xâm lược Trung Quốc.",Nguyên nhân chính giúp Nhật Bản vươn lên thành cường quốc đầu thế kỉ XX là gì?,Có hệ thống thuộc địa rộng lớn.,Thực hiện công nghiệp hóa sớm và thành công.,Được Mỹ viện trợ sau chiến tranh.,Sáp nhập Triều Tiên và Việt Nam.,B
L3_09,BÀI 3: CHÂU Á (1918 - 1945),"Năm 1927, Tưởng Giới Thạch tiến hành chính biến, phản bội cách mạng, đàn áp Đảng Cộng sản Trung Quốc, dẫn đến nội chiến kéo dài ở Trung Quốc.",Nguyên nhân trực tiếp dẫn đến nội chiến ở Trung Quốc sau năm 1927 là gì?,Nhật Bản xâm lược Trung Quốc.,Tưởng Giới Thạch phản bội cách mạng và đàn áp cộng sản.,Kinh tế Trung Quốc khủng hoảng trầm trọng.,Sự thất bại của phong trào Ngũ Tứ.,B
L3_10,BÀI 3: CHÂU Á (1918 - 1945),"Trong Chiến tranh thế giới thứ hai, nhiều nước châu Á trở thành thuộc địa, căn cứ quân sự của phe phát xít. Phong trào kháng chiến ở các nước phát triển mạnh.",Nguyên nhân nào khiến phong trào kháng chiến ở châu Á phát triển mạnh trong Chiến tranh thế giới thứ hai?,Sự áp bức của phát xít và thực dân.,Kinh tế châu Á phát triển nhanh.,"Các nước châu Á đã được Anh, Mỹ giúp đỡ toàn diện.",Các nước châu Á thành lập liên minh quân sự chung.,A
L3_11,BÀI 3: CHÂU Á (1918 - 1945),"Phong trào độc lập dân tộc ở Indonesia phát triển mạnh, tiêu biểu là sự ra đời của Đảng Quốc gia Indonesia (1927) do A. Xucácnô lãnh đạo.",Lãnh tụ tiêu biểu của phong trào giải phóng dân tộc ở Indonesia giai đoạn 1920–1945 là chi?,Mao Trạch Đông.,M. Gandhi.,A. Xucácnô.,Hồ Chí Minh.,C
L3_12,BÀI 3: CHÂU Á (1918 - 1945),"Phong trào Ngũ Tứ là cuộc biểu tình lớn của sinh viên, học sinh và trí thức Trung Quốc chống sự áp bức của đế quốc, phong kiến, mở đầu cao trào cách mạng mới ở Trung Quốc.",Đối tượng tham gia chủ yếu trong phong trào Ngũ Tứ là ai?,Nông dân và công nhân.,"Sinh viên, học sinh và trí thức.",Quý tộc phong kiến.,Thương nhân và địa chủ.,B
L3_13,BÀI 3: CHÂU Á (1918 - 1945),"Trong những năm 30 của thế kỉ XX, cuộc khủng hoảng kinh tế thế giới (1929–1933) đã tác động mạnh mẽ đến châu Á, làm trầm trọng thêm tình trạng áp bức, bóc lột.",Hệ quả nổi bật của khủng hoảng kinh tế 1929–1933 ở châu Á là gì?,Nền kinh tế thuộc địa khủng hoảng sâu sắc.,Châu Á trở thành trung tâm công nghiệp thế giới.,Các nước châu Á giành được độc lập nhanh chóng.,Các đế quốc châu Âu suy yếu nghiêm trọng.,A
L3_14,BÀI 3: CHÂU Á (1918 - 1945),"Cuối năm 1941, Nhật Bản mở rộng chiến tranh ra toàn châu Á – Thái Bình Dương, nhiều nước Đông Nam Á bị Nhật chiếm đóng.",Nhật Bản mở rộng chiến tranh ở châu Á – Thái Bình Dương nhằm mục tiêu chính gì?,Xây dựng hệ thống thuộc địa rộng lớn.,Hỗ trợ phong trào giải phóng dân tộc.,Ngăn cản Liên Xô tiến ra biển.,Tránh sự tấn công của quân Anh – Mỹ.,A
L3_15,BÀI 3: CHÂU Á (1918 - 1945),"Cách mạng tháng Tám 1945 thành công đã chấm dứt ách thống trị của thực dân, phong kiến, lập nên nhà nước Việt Nam Dân chủ Cộng hòa – Nhà nước công nông đầu tiên ở Đông Nam Á.",Đặc điểm nổi bật của Nhà nước Việt Nam Dân chủ Cộng hòa khi mới thành lập là gì?,Là nhà nước công nông đầu tiên ở Đông Nam Á.,Là nhà nước cộng hòa đầu tiên ở châu Á.,Được thành lập nhờ viện trợ của Mỹ.,Là chế độ quân chủ lập hiến.,A
L4_01,BÀI 4: CHIẾN TRANH THẾ GIỚI THỨ HAI (1939 - 1945),"Ngày 1-9-1939, quân đội Đức ồ ạt tấn công Ba Lan. Hai ngày sau, Anh và Pháp tuyên chiến với Đức. Chiến tranh thế giới thứ hai chính thức bùng nổ.",Sự kiện nào là nguyên nhân trực tiếp dẫn tới Chiến tranh thế giới thứ hai?,Đức và Liên Xô ký Hiệp ước Xô – Đức không xâm lược lẫn nhau,Đức tấn công Ba Lan,Anh và Pháp tuyên chiến với Đức,Đức chiếm Áo và Tiệp Khắc,B
L4_02,BÀI 4: CHIẾN TRANH THẾ GIỚI THỨ HAI (1939 - 1945),"Sau khi chiếm được phần lớn lãnh thổ Tây Âu, quân Đức tiến hành tấn công Liên Xô vào ngày 22-6-1941, mở ra một mặt trận chiến tranh mới.",Sự kiện này đánh dấu điều gì trong chiến lược của Đức?,Đức chuyển trọng tâm sang chiến trường Bắc Phi,Đức thực hiện kế hoạch ‘Barbarossa’ nhằm đánh bại Liên Xô,Đức tìm cách liên minh với Liên Xô,Đức rút quân về phòng thủ,B
L4_03,BÀI 4: CHIẾN TRANH THẾ GIỚI THỨ HAI (1939 - 1945),"Ngày 7-12-1941, Nhật Bản bất ngờ tập kích hạm đội Mỹ ở Trân Châu Cảng (Hawaii), khiến hơn 2000 người thiệt mạng. Hôm sau, Mỹ tuyên chiến với Nhật Bản.",Sự kiện này có ý nghĩa gì đối với cục diện chiến tranh?,Chiến tranh lan rộng ra toàn cầu,Nhật Bản kết thúc chiến tranh,Đức bị buộc đầu hàng ngay lập tức,Chiến tranh chuyển sang châu Âu,A
L4_04,BÀI 4: CHIẾN TRANH THẾ GIỚI THỨ HAI (1939 - 1945),"Tháng 6-1942, quân đội Mỹ giành thắng lợi ở trận Midway, chặn đà tiến công của Nhật ở Thái Bình Dương.",Chiến thắng Midway có ý nghĩa chiến lược gì?,Nhật mở rộng thêm lãnh thổ,Mỹ giành quyền chủ động chiến lược ở Thái Bình Dương,Liên Xô rút khỏi chiến tranh,Đức chuyển quân sang Thái Bình Dương,B
L4_05,BÀI 4: CHIẾN TRANH THẾ GIỚI THỨ HAI (1939 - 1945),"Trong Chiến dịch Stalingrad (7-1942 đến 2-1943), Hồng quân Liên Xô tiêu diệt, bắt sống hơn 30 vạn quân Đức, làm xoay chuyển cục diện chiến tranh ở châu Âu.",Vì sao Stalingrad được coi là bước ngoặt quyết định ở châu Âu?,Liên Xô ký hiệp định đình chiến với Đức,Quân Đức hoàn toàn làm chủ mặt trận phía Đông,Cục diện chiến tranh chuyển sang phe Đồng minh,Liên Xô rút khỏi cuộc chiến,C
L4_06,BÀI 4: CHIẾN TRANH THẾ GIỚI THỨ HAI (1939 - 1945),"Tháng 11-1943, Hội nghị Ianta được triệu tập với sự tham gia của Liên Xô, Mỹ, Anh để bàn về việc tiêu diệt phát xít, thành lập tổ chức quốc tế mới.",Tổ chức quốc tế nào ra đời sau hội nghị này?,NATO,ASEAN,Liên hợp quốc,Liên minh châu Âu,C
L4_07,BÀI 4: CHIẾN TRANH THẾ GIỚI THỨ HAI (1939 - 1945),"Ngày 6 và 9-8-1945, Mỹ ném hai quả bom nguyên tử xuống Hiroshima và Nagasaki. Nhật Bản tuyên bộ đầu hàng vô điều kiện ngày 15-8-1945.",Sự kiện này chứng minh điều gì về chiến tranh thế giới thứ hai?,Lần đầu tiên vũ khí hạt nhân được sử dụng trong chiến tranh,Nhật Bản tăng cường sức mạnh quân sự,Liên Xô rút quân khỏi châu Á,Mỹ thất bại ở Thái Bình Dương,A
L4_08,BÀI 4: CHIẾN TRANH THẾ GIỚI THỨ HAI (1939 - 1945),"Ngày 9-5-1945, Đức kí văn kiện đầu hàng vô điều kiện Hồng quân Liên Xô ở Berlin, Chiến tranh thế giới thứ hai ở châu Âu kết thúc.",Sự kiện này diễn ra trước hay sau khi Nhật đầu hàng?,Trước,Sau,Cùng ngày,Không liên quan,A
L4_09,BÀI 4: CHIẾN TRANH THẾ GIỚI THỨ HAI (1939 - 1945),"Trong những năm 1939-1945, phong trào kháng chiến chống phát xít và đấu tranh giải phóng dân tộc phát triển mạnh mẽ ở nhiều nước thuộc địa.",Phong trào này phản ánh điều gì?,Thực dân phương Tây từ bỏ thuộc địa,Chiến tranh đã thúc đẩy phong trào giải phóng dân tộc,Chủ nghĩa phát xít được nhân dân ủng hộ,Không nước nào tham gia chiến tranh,B
L4_10,BÀI 4: CHIẾN TRANH THẾ GIỚI THỨ HAI (1939 - 1945),"Đầu năm 1945, quân Đồng minh mở cuộc tổng tấn công, giải phóng hoàn toàn các nước Tây Âu, tiến vào lãnh thổ Đức.",Điều này cho thấy tình hình chiến tranh ở châu Âu như thế nào?,Phe Trục thắng thế,Đức giữ thế phòng thủ,Chiến tranh chấm dứt ngay lập tức,Phe Đồng minh thất bại,B
L4_11,BÀI 4: CHIẾN TRANH THẾ GIỚI THỨ HAI (1939 - 1945),"Nhật Bản, Đức, Ý là những quốc gia theo đuổi chính sách bành trướng, xâm lược, thiết lập chế độ độc tài phát xít.",Khối liên minh giữa ba nước này gọi là gì?,Khối Liên minh quân sự Đông Dương,Khối Trục,Khối NATO,Khối Warsaw,B
L4_12,BÀI 4: CHIẾN TRANH THẾ GIỚI THỨ HAI (1939 - 1945),"Ngay trong những ngày đầu chiến tranh, Đức sử dụng chiến thuật ‘đánh chớp nhoáng’, kết hợp không quân và xe tăng để tiến công nhanh chóng.",Chiến thuật này giúp Đức làm gì?,Chiếm phần lớn Tây Âu trong thời gian ngắn,Ký hòa ước với Anh và Pháp,Mở rộng quan hệ ngoại giao,Tránh chiến tranh với Liên Xô,A
L4_13,BÀI 4: CHIẾN TRANH THẾ GIỚI THỨ HAI (1939 - 1945),"Ngày 8-5-1945, chính phủ Đức ký văn kiện đầu hàng không điều kiện. Đây là kết thúc chiến tranh thế giới thứ hai ở châu Âu.",Văn kiện này được ký tại đâu?,Paris,Berlin,London,Moscow,B
L4_14,BÀI 4: CHIẾN TRANH THẾ GIỚI THỨ HAI (1939 - 1945),"Trong giai đoạn 1942-1943, Liên Xô không chỉ đứng vững mà còn phản công mạnh mẽ, tiêu diệt lực lượng chủ lực của Đức tại Stalingrad.",Điều này phản ánh vai trò của Liên Xô như thế nào?,Bị loại khỏi chiến tranh,Là lực lượng chính đánh bại phát xít ở châu Âu,Đồng minh của Đức,Không ảnh hưởng đến chiến tranh,B
L4_15,BÀI 4: CHIẾN TRANH THẾ GIỚI THỨ HAI (1939 - 1945),"Chiến tranh thế giới thứ hai là cuộc chiến lớn nhất trong lịch sử, gây thiệt hại nặng nề về người và của, làm thay đổi bản đồ chính trị thế giới.",Hậu quả lớn nhất của chiến tranh là gì?,Thế giới ổn định ngay sau chiến tranh,Chủ nghĩa phát xít phát triển mạnh,"Hàng chục triệu người chết, nhiều nước bị tàn phá",Không có biến đổi về chính trị,C
`;

export const formatDriveLink = (url: string): string => {
  if (!url) return '';
  
  // Regex mạnh mẽ để trích xuất ID file/folder từ mọi định dạng link Drive
  const idMatch = url.match(/\/d\/([^/]+)/) || 
                  url.match(/id=([^&/]+)/) || 
                  url.match(/\/folders\/([^/]+)/);
  
  if (idMatch && idMatch[1]) {
    const fileId = idMatch[1];
    // Định dạng /preview là chuẩn tốt nhất để nhúng Iframe không bị chặn
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  
  return url;
};

export const fetchExams = async (): Promise<Exam[]> => {
  return new Promise((resolve) => {
    const source = GOOGLE_SHEET_CSV_URL || CSV_CONTENT;
    
    Papa.parse<RawExamData>(source, {
      download: !!GOOGLE_SHEET_CSV_URL,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const transformed: Exam[] = results.data
          .filter(row => row['Tên đề thi'])
          .map((row) => ({
            id: row.ID || Math.random().toString(36).substr(2, 9),
            title: row['Tên đề thi'],
            year: row['Năm học'],
            province: row['Địa phương'],
            difficulty: row['Mức độ'],
            pdfUrl: formatDriveLink(row['Link đề'] || ''),
            answerUrl: formatDriveLink(row['Đáp án'] || ''),
            updatedAt: '10/05/2024'
          }));
        console.log('Dữ liệu đề thi đã tải:', transformed);
        resolve(transformed);
      },
      error: (error) => {
        console.error('Lỗi khi tải dữ liệu đề thi:', error);
        resolve([]);
      }
    });
  });
};

export const fetchTopics = async (): Promise<Topic[]> => {
  return new Promise((resolve) => {
    const source = GOOGLE_SHEET_TOPICS_CSV_URL || TOPICS_CSV_CONTENT;
    
    Papa.parse<RawTopicData>(source, {
      download: !!GOOGLE_SHEET_TOPICS_CSV_URL,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const transformed: Topic[] = results.data
          .filter(row => row['Tên chuyên đề'])
          .map((row) => ({
            id: row.ID || Math.random().toString(36).substr(2, 9),
            title: row['Tên chuyên đề'],
            pdfUrl: formatDriveLink(row['Link tài liệu'] || ''),
          }));
        console.log('Dữ liệu chuyên đề đã tải:', transformed);
        resolve(transformed);
      },
      error: (error) => {
        console.error('Lỗi khi tải dữ liệu chuyên đề:', error);
        resolve([]);
      }
    });
  });
};

export const fetchQuizzes = async (): Promise<QuizItem[]> => {
  return new Promise((resolve) => {
    const source = GOOGLE_SHEET_QUIZ_CSV_URL || QUIZ_CSV_CONTENT;
    
    Papa.parse<RawQuizData>(source, {
      download: !!GOOGLE_SHEET_QUIZ_CSV_URL,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const transformed: QuizItem[] = results.data
          .filter(row => row['Câu hỏi'] || row['Bài'])
          .map((row) => {
            const rawQuestion = row['Câu hỏi'] || '';
            const materialMatch = rawQuestion.match(/\[(.*?)\]/);
            const material = materialMatch ? materialMatch[1] : (row['Tư liệu'] || '');
            const question = rawQuestion.replace(/\[.*?\]/, '').trim();

            return {
              id: row.ID || Math.random().toString(36).substr(2, 9),
              lesson: row['Bài'] || 'Chưa phân loại',
              material: material,
              question: question,
              options: {
                A: row['Đáp án A'],
                B: row['Đáp án B'],
                C: row['Đáp án C'],
                D: row['Đáp án D'],
              },
              correctAnswer: (row['Đáp án đúng'] || '').trim().toUpperCase() as 'A' | 'B' | 'C' | 'D'
            };
          });
        console.log('Dữ liệu trắc nghiệm đã tải:', transformed);
        resolve(transformed);
      },
      error: (error) => {
        console.error('Lỗi khi tải dữ liệu trắc nghiệm:', error);
        resolve([]);
      }
    });
  });
};
